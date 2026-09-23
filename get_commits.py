import subprocess
out = subprocess.check_output(['git', 'log', '-n', '20', '--oneline']).decode('utf-8')
print(out)
