#!/usr/bin/env python3
"""Exact retrieval workload and strong full-history scan reference.

Dictionary cache uses variable-size external memory; this is an algorithmic
comparison of operations, not a fair parameter-matched LLM benchmark.
"""
import json,time,random,statistics
from pathlib import Path
from fibonacci_topo_net_v4 import VersionedAssociativeMemory
ROOT=Path(__file__).resolve().parent

def scan(history,key):
    for op,k,v in reversed(history):
        if k==key:
            return (True,v) if op=='SET' else (False,None)
    return False,None

def dataset(nwrites,nqueries,nkeys,seed):
    r=random.Random(seed)
    history=[]
    for i in range(nwrites):
        k=r.randrange(nkeys)
        if i%9==0:history.append(('DEL',k,None))
        else: history.append(('SET',k,r.randrange(1,1000000)))
    qs=[r.randrange(nkeys) for _ in range(nqueries)]
    return history,qs

results=[]
for nw,nq,nkeys in [(500,1000,128),(2000,2000,512),(8000,4000,1024)]:
    history,queries=dataset(nw,nq,nkeys,seed=20261016+nw)
    cached=[];scanned=[]
    for rep in range(3):
        t0=time.perf_counter()
        memory=VersionedAssociativeMemory()
        for op,k,v in history:
            if op=='SET':memory.set(k,v)
            else:memory.delete(k)
        vals=[(a.status=='known',a.value) for key in queries for a in [memory.get(key)]]
        t1=time.perf_counter()
        cached.append(t1-t0)
        t2=time.perf_counter()
        ref=[scan(history,key) for key in queries]
        t3=time.perf_counter()
        scanned.append(t3-t2)
        assert vals==ref
    results.append({'writes':nw,'queries':nq,'key_universe':nkeys,'retained_keys':len(memory),
       'cache_build_plus_queries_ms':round(statistics.median(cached)*1000,3),
       'history_scan_queries_only_ms':round(statistics.median(scanned)*1000,3),
       'exact_agreement':True})

# Multi-hop graph task with distractors, capacity, and fail-closed unknown.
multihop=[]
for n in [1,2,4,8,16,32,64,128]:
    m=VersionedAssociativeMemory()
    for i in range(n):m.set(10000+i,10000+i+1)
    for i in range(2000):m.set(20000+i,30000+i)
    result=m.follow(10000,n,max_steps=256)
    assert result.status=='known' and result.value==10000+n and m.check_evidence(result)
    multihop.append({'hop_count':n,'correct':True,'evidence_records':len(result.evidence),'executed_steps':result.steps})
output={'runs':results,'multihop':multihop,'notes':['cache cost includes build and reads; full-history scan cost excludes build',
  'exact data structures are not learned and scale memory with key count','no comparison to production model throughput']}
(ROOT/'ALGORITHMIC_BENCHMARK.json').write_text(json.dumps(output,indent=2))
print(json.dumps(output,indent=2))