"""Parallel isolated unittest suite launcher, preserving exact command/status/output."""
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
import subprocess,json,re,time,sys,os
ROOT=Path(__file__).resolve().parents[1]
tests=re.findall(r'^    def (test_\d+_[a-z_]+)\(', (ROOT/'tests/test_newsroom_v2.py').read_text(),re.M)
min_n=int(sys.argv[1]) if len(sys.argv)>1 else 1
max_n=int(sys.argv[2]) if len(sys.argv)>2 else 25
tests=[n for n in tests if min_n<=int(n.split('_')[1])<=max_n]
start=time.monotonic(); results=[]
def run(name):
    cmd=['python3','-m','unittest','tests.test_newsroom_v2.CLIIntegration.'+name,'-v']
    p=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True,timeout=70)
    return {'case':name,'expected':'PASS','actual':'PASS' if p.returncode==0 else 'FAIL','exit_code':p.returncode,'stdout':p.stdout[-1000:],'stderr':p.stderr[-1500:]}
with ThreadPoolExecutor(max_workers=3) as ex:
    for f in as_completed({ex.submit(run,n):n for n in tests}):
        try:r=f.result()
        except Exception as e:r={'case':'UNKNOWN','expected':'PASS','actual':'ERROR','exit_code':-1,'stderr':str(e)}
        results.append(r);print(r['case'],r['actual'],flush=True)
results.sort(key=lambda x:x['case'])
out={'node_version':subprocess.check_output(['node','--version'],text=True).strip(),
     'python_version':sys.version.split()[0],'total':len(results),
     'passed':sum(x['actual']=='PASS' for x in results),'failed':sum(x['actual']!='PASS' for x in results),
     'elapsed_seconds':round(time.monotonic()-start,2),'results':results}
(ROOT/f'output/test-matrix-{min_n:02d}-{max_n:02d}.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='results'},ensure_ascii=False))
if out['failed']:sys.exit(1)
