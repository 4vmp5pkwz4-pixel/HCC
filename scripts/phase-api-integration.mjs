const clone=x=>JSON.parse(JSON.stringify(x??{}));

export function attachPhaseDiscovery({agent,manifest,phaseTools=[],resource='./api/phase-space.json'}){
  const a=clone(agent), m=clone(manifest);
  a.resources={...(a.resources||{}),phase_space:resource};
  m.contracts={...(m.contracts||{}),phase_space:resource};
  a.phase_space={
    schema:'hcc.phase-space/1',
    resource,
    tools:[...phaseTools],
    candidate_policy:'noncanonical; hidden unless explicitly requested'
  };
  return {agent:a,manifest:m};
}
