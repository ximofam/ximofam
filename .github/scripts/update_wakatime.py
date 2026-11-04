"""Update the WakaTime README section using a personal OAuth token."""
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


def fetch_stats(period):
    token = os.environ.get('WAKATIME_API_KEY', '')
    if not token:
        raise RuntimeError('Set WAKATIME_API_KEY to a personal OAuth token from https://wakatime.com/oauth')
    for attempt in range(10):
        request = Request(
            f'https://api.wakatime.com/api/v1/users/current/stats/{period}',
            headers={'Authorization': f'Bearer {token}'},
        )
        try:
            with urlopen(request, timeout=30) as response:
                status = response.status
                payload = json.load(response)
        except HTTPError as error:
            raise RuntimeError(f'WakaTime {period}: HTTP {error.code}; check OAuth token and read_stats permission') from None
        if status == 200 and isinstance(payload.get('data'), dict):
            return payload['data']
        if status not in (201, 202):
            raise RuntimeError(f'WakaTime {period}: unexpected response HTTP {status}')
        print(f'WakaTime {period}: calculating statistics ({attempt + 1}/10)', flush=True)
        if attempt < 9:
            time.sleep(30)
    raise RuntimeError(f'WakaTime {period}: still calculating; run the workflow again later')


def render(weekly, total):
    duration = total.get('human_readable_total', '0 secs')
    lines = [f'![Code Time](https://img.shields.io/badge/Code%20Time-{quote(duration, safe="")}-blue?style=flat)', '',
             '📊 **This Week I Spent My Time On**', '', '```text',
             f'🕑 Time Zone: {weekly.get("timezone", "Asia/Ho_Chi_Minh")}', '']
    for key, title, limit in [('languages', '💬 Programming Languages:', 5),
                               ('operating_systems', '💻 Operating System:', None)]:
        lines.append(title)
        entries = weekly.get(key, [])
        for entry in entries[:limit]:
            percent = float(entry.get('percent', 0))
            filled = max(0, min(25, round(percent / 4)))
            bar = '█' * filled + '░' * (25 - filled)
            lines.append(f'{entry["name"]:<24} {entry.get("text", "0 secs"):<18} {bar} {percent:6.2f} %')
        if not entries:
            lines.append('No coding activity recorded in the last 7 days.')
        lines.append('')
    lines.extend(['```', '', 'Last Updated on ' + datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M:%S UTC')])
    return '\n'.join(lines)


def main():
    weekly = fetch_stats('last_7_days')
    total = fetch_stats('all_time')
    path = Path('README.md')
    content = path.read_text()
    start, end = '<!--START_SECTION:waka-->', '<!--END_SECTION:waka-->'
    if content.count(start) != 1 or content.count(end) != 1:
        raise RuntimeError('README must contain exactly one WakaTime marker pair')
    before, rest = content.split(start)
    _, after = rest.split(end)
    path.write_text(before + start + '\n' + render(weekly, total) + '\n' + end + after)
    print('Updated WakaTime statistics in README.md')


if __name__ == '__main__':
    main()
