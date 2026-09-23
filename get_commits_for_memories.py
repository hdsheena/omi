import subprocess
out = subprocess.check_output(['git', 'log', '-n', '10', '--oneline', 'backend/database/memories.py']).decode('utf-8')
print(out)
