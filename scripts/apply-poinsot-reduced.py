from pathlib import Path
p=Path("index.html")
s=p.read_text()
old="""  // the polhode family: closed loops near I₁ and I₃, giant figure-eights near I₂
  const polGrp=new THREE.Group(); poinGroup.add(polGrp);"""
new="""  // the polhode family: the geometry of the two invariants, not only the live orbit.
  // Each curve is sampled from the same exact Jacobi solution as the moving tip.
  const polGrp=new THREE.Group(); poinGroup.add(polGrp);
  const rMin=I1/I2, rMax=I3/I2;
  const familyRatios=[.58,.72,.84,.93,.975,1.025,1.07,1.16,1.30,1.42]
    .filter(r=>r>rMin+2e-3&&r<rMax-2e-3);
  familyRatios.forEach(r=>{
    const l2=2*E*I2*r, P=poinSolve(I1,I2,I3,E,l2), K=agmK(P.k);
    if(!Number.isFinite(K)||!Number.isFinite(P.tau)||P.tau<=0) return;
    const T=4*K/P.tau, pts=[];
    for(let n=0;n<=320;n++){ const w=poinOmega(P,T*n/320); pts.push(new THREE.Vector3(S*w[0],S*w[1],S*w[2])); }
    const near=Math.abs(r-1)<.04;
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({color:near?0xff7a86:0x74bfff,transparent:true,opacity:near?.34:.18,depthWrite:false}));
    line.userData={kind:'polhode-family',L2_over_2EI2:r,exact:true}; polGrp.add(line);
  });"""
assert old in s
s=s.replace(old,new,1)
old_title="TT('POINSOT · DZHANIBEKOV — ω lives on the intersection of two ellipsoids','ПУАНСО · ДЖАНИБЕКОВ — ω живёт на пересечении двух эллипсоидов','POINSOT · DSHANIBEKOW — ω lebt auf dem Schnitt zweier Ellipsoide')"
new_title="TT('REDUCED EULER TOP · DZHANIBEKOV — ω-space intersection geometry','РЕДУЦИРОВАННЫЙ ВОЛЧОК ЭЙЛЕРА · ДЖАНИБЕКОВ — геометрия пересечения в ω-пространстве','REDUZIERTER EULER-KREISEL · DSHANIBEKOW — Schnittgeometrie im ω-Raum')"
assert old_title in s
s=s.replace(old_title,new_title,1)
old_comment="  // integrate the body attitude from ω so the tumble is literal"
new_comment="  // Illustrative first-order attitude reconstruction from exact reduced ω(t).\n  // This mesh is deliberately not labelled as the classical Poinsot rolling construction."
assert old_comment in s
s=s.replace(old_comment,new_comment,1)
p.write_text(s)
