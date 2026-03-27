/*
  Simple Human vs The Foundry simulator
  Re-skinned: The Foundry captures and converts humans into infrastructure.
  Modular, single-file simulation core + rendering
*/

const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');

let W = 0, H = 0;
function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
addEventListener('resize', resize);
resize();

// Parameters & UI binding
const state = {
  cols: 48,
  rows: 32,
  cellSize: 0,
  time: 0,
  running: true,
  speed: 1,
  humanAggressiveness: 0.25,
  corruptionStrength: 0.3,
  power: 100,
  integrity: 100,
  corruption: 0,
  // sector meters
  contamination: 0, // contamination / mess / fire risk (0..1)
  control: 0.5,     // 0 = human control, 1 = Swarm control

  // new params
  maxHumans: 30,
  maxBots: 12,
  humanSpawnRatePerMin: 12, // per minute
  botSpawnRatePerMin: 4, // per minute
  corruptionSpreadIntensity: 1.0,
  resourceSpawnRatePerMin: 6,
  maxResources: 20
};

const ui = {
  time: document.getElementById('time'),
  power: document.getElementById('power'),
  integrity: document.getElementById('integrity'),
  corrupt: document.getElementById('corrupt'),
  // new sector meters in UI
  contam: document.getElementById('contam'),
  control: document.getElementById('control'),
  pause: document.getElementById('pause'),
  step: document.getElementById('step'),
  speed: document.getElementById('speed'),
  aggr: document.getElementById('aggr'),
  corstr: document.getElementById('corstr'),
  // new UI elements
  maxHumans: document.getElementById('maxHumans'),
  maxHumansVal: document.getElementById('maxHumansVal'),
  maxBots: document.getElementById('maxBots'),
  maxBotsVal: document.getElementById('maxBotsVal'),
  humanRate: document.getElementById('humanRate'),
  humanRateVal: document.getElementById('humanRateVal'),
  botRate: document.getElementById('botRate'),
  botRateVal: document.getElementById('botRateVal'),
  corSpread: document.getElementById('corSpread'),
  corSpreadVal: document.getElementById('corSpreadVal'),
  resRate: document.getElementById('resRate'),
  resRateVal: document.getElementById('resRateVal'),
  maxResources: document.getElementById('maxResources'),
  maxResourcesVal: document.getElementById('maxResourcesVal'),
  // quick-term readouts
  sprawl: document.getElementById('sprawl'),
  alert: document.getElementById('alert'),
  hostsupply: document.getElementById('hostsupply')
};

ui.pause.addEventListener('click', () => { state.running = !state.running; ui.pause.textContent = state.running ? 'Pause' : 'Resume'; });
ui.step.addEventListener('click', () => { step(1/60); render(); });
ui.speed.addEventListener('input', (e)=> state.speed = +e.target.value);
ui.aggr.addEventListener('input', (e)=> state.humanAggressiveness = +e.target.value);
ui.corstr.addEventListener('input', (e)=> state.corruptionStrength = +e.target.value);

// wire new controls & live values
ui.maxHumans.addEventListener('input', e => { state.maxHumans = +e.target.value; ui.maxHumansVal.textContent = state.maxHumans; });
ui.maxHumansVal.textContent = state.maxHumans;
ui.maxBots.addEventListener('input', e => { state.maxBots = +e.target.value; ui.maxBotsVal.textContent = state.maxBots; });
ui.maxBotsVal.textContent = state.maxBots;
ui.humanRate.addEventListener('input', e => { state.humanSpawnRatePerMin = +e.target.value; ui.humanRateVal.textContent = state.humanSpawnRatePerMin; });
ui.humanRateVal.textContent = state.humanSpawnRatePerMin;
ui.botRate.addEventListener('input', e => { state.botSpawnRatePerMin = +e.target.value; ui.botRateVal.textContent = state.botSpawnRatePerMin; });
ui.botRateVal.textContent = state.botSpawnRatePerMin;
ui.corSpread.addEventListener('input', e => { state.corruptionSpreadIntensity = +e.target.value; ui.corSpreadVal.textContent = (+e.target.value).toFixed(2); });
ui.corSpreadVal.textContent = state.corruptionSpreadIntensity.toFixed(2);
ui.resRate.addEventListener('input', e => { state.resourceSpawnRatePerMin = +e.target.value; ui.resRateVal.textContent = state.resourceSpawnRatePerMin; });
ui.resRateVal.textContent = state.resourceSpawnRatePerMin;
ui.maxResources.addEventListener('input', e => { state.maxResources = +e.target.value; ui.maxResourcesVal.textContent = state.maxResources; });
ui.maxResourcesVal.textContent = state.maxResources;

// Grid cell types
const CELL = {
  EMPTY: 0,
  TUNNEL: 1,
  BLOCKED: 2
};

// Alien bug classes
const BUG = {
  SNARE: 'snare_unit',        // snare raider (formerly raptor)
  SALVAGE: 'salvage_drone',   // carrier/worker (formerly graftling)
  CAPTURE_POD: 'capture_pod', // stationary ambush (formerly nestpod)
  INJECTOR: 'injector_skitter',// latch/inject (formerly skitterling)
  RECLAIMER: 'reclaimer_scout',// feeder (formerly scavengebug)
  COCOON: 'fabrication_cradle',// pupa/pupa node
  QUEEN: 'core_architect'     // matron / brood matron
};

// Create grid with an anthill-like cluster of tunnels
let grid, aliens, humans, resources;
function initSim(){
  state.cols = Math.max(24, Math.floor(W / 20));
  state.rows = Math.max(16, Math.floor(H / 20));
  state.cellSize = Math.min(Math.floor(W/state.cols), Math.floor(H/state.rows));
  grid = new Array(state.rows);
  for(let y=0;y<state.rows;y++){
    grid[y]=new Array(state.cols).fill(CELL.EMPTY);
  }

  // carve tunnels from center with random walk
  const cx = Math.floor(state.cols/2), cy = Math.floor(state.rows/2);
  let x=cx,y=cy;
  grid[y][x]=CELL.TUNNEL;
  for(let i=0;i<state.cols*state.rows*1.5;i++){
    const dir = Math.floor(Math.random()*4);
    if(dir===0) x=Math.min(state.cols-2,x+1);
    if(dir===1) x=Math.max(1,x-1);
    if(dir===2) y=Math.min(state.rows-2,y+1);
    if(dir===3) y=Math.max(1,y-1);
    grid[y][x]=CELL.TUNNEL;
    // sometimes branch
    if(Math.random()<0.05){
      let bx=x,by=y;
      for(let j=0;j<Math.random()*10;j++){
        const d=Math.floor(Math.random()*4);
        if(d===0) bx=Math.min(state.cols-2,bx+1);
        if(d===1) bx=Math.max(1,bx-1);
        if(d===2) by=Math.min(state.rows-2,by+1);
        if(d===3) by=Math.max(1,by-1);
        grid[by][bx]=CELL.TUNNEL;
      }
    }
  }

  // agents
  aliens = [];
  humans = [];
  resources = [];
  // initial alien mix: a few raptors, graftlings, and a matron if space
  for(let i=0;i<6;i++){
    const t = i<2 ? BUG.RAPTOR : i<4 ? BUG.GRAFT : BUG.SCAVENGE;
    aliens.push({type:t, x:cx+Math.floor(Math.random()*6-3), y:cy+Math.floor(Math.random()*6-3), hp: t===BUG.MATRON?200: (t===BUG.GRAFT?60:40), state:{}, timer:0});
  }
  // maybe a matron rarely
  if(Math.random() < 0.15) aliens.push({type:BUG.MATRON, x:cx+1, y:cy+1, hp:300, state:{laying:false}, timer:0});

  // spawn a few human vandals at edges
  for(let i=0;i<Math.max(2,Math.floor((state.cols*state.rows)/400));i++){
    const side = Math.floor(Math.random()*4);
    let hx = side===0?0: side===1?state.cols-1 : Math.floor(Math.random()*state.cols);
    let hy = side===2?0: side===3?state.rows-1 : Math.floor(Math.random()*state.rows);
    humans.push({x:hx,y:hy,active:true, life: 20 + Math.random()*40, tagged:0});
  }

  // cell overlays
  // health: for tunnels, 1 is pristine, 0 is destroyed/blocked
  for(let y=0;y<state.rows;y++){
    for(let x=0;x<state.cols;x++){
      if(grid[y][x]===CELL.TUNNEL){
        grid[y][x] = {type:CELL.TUNNEL, health:1, corrupt:0, sprawl:0};
      } else {
        grid[y][x] = {type:CELL.EMPTY, health:0, corrupt:0, sprawl:0};
      }
    }
  }

  state.time = 0;
  state.power = 100;
  state.integrity = 100;
  state.corruption = 0;
}

initSim();

// Helpers
function neighbors(cx,cy){
  const list=[];
  const d = [[1,0],[-1,0],[0,1],[0,-1]];
  for(const [dx,dy] of d){
    const nx=cx+dx, ny=cy+dy;
    if(nx>=0&&nx<state.cols&&ny>=0&&ny<state.rows) list.push([nx,ny]);
  }
  return list;
}

function randomWalkTowards(sx,sy,tx,ty){
  // pick neighbor that reduces manhattan distance with some randomness
  const n = neighbors(sx,sy);
  n.sort((a,b)=>Math.abs(a[0]-tx)+Math.abs(a[1]-ty) - (Math.abs(b[0]-tx)+Math.abs(b[1]-ty)));
  if(Math.random() < 0.15) return n[Math.floor(Math.random()*n.length)];
  return n[0];
}

// Simulation step
let humanSpawnAccumulator = 0;
let botSpawnAccumulator = 0;
let resourceSpawnAccumulator = 0;

function step(dt){
  // dt is seconds; apply speed
  const simDt = dt * state.speed;
  state.time += simDt;
  // spawn accumulators per second
  const humanPerSec = state.humanSpawnRatePerMin / 60;
  const botPerSec = state.botSpawnRatePerMin / 60;
  const resPerSec = state.resourceSpawnRatePerMin / 60;

  humanSpawnAccumulator += humanPerSec * simDt;
  botSpawnAccumulator += botPerSec * simDt;
  resourceSpawnAccumulator += resPerSec * simDt;

  // Humans spawn respecting maxHumans
  while(humanSpawnAccumulator >= 1){
    humanSpawnAccumulator -= 1;
    if(humans.length < state.maxHumans){
      const side = Math.floor(Math.random()*4);
      let hx = side===0?0: side===1?state.cols-1 : Math.floor(Math.random()*state.cols);
      let hy = side===2?0: side===3?state.rows-1 : Math.floor(Math.random()*state.rows);
      humans.push({x:hx,y:hy,active:true,life:20 + Math.random()*40});
    }
  }
  // Bots spawn respecting maxBots: spawn varied bug types
  while(botSpawnAccumulator >= 1){
    botSpawnAccumulator -= 1;
    if(aliens.length < state.maxBots){
      const cx = Math.floor(state.cols/2), cy = Math.floor(state.rows/2);
      // weighted spawn
      const r = Math.random();
      let type = BUG.GRAFT;
      if(r < 0.25) type = BUG.RAPTOR;
      else if(r < 0.45) type = BUG.SCAVENGE;
      else if(r < 0.6) type = BUG.GRAFT;
      else type = BUG.PUPA;
      const baseHp = type===BUG.MATRON?300: type===BUG.GRAFT?60: type===BUG.RAPTOR?70:40;
      aliens.push({type:type, x:cx+Math.floor(Math.random()*6-3), y:cy+Math.floor(Math.random()*6-3), hp:baseHp, state:{}, timer:0});
    }
  }
  // Resources spawn respecting maxResources
  while(resourceSpawnAccumulator >= 1){
    resourceSpawnAccumulator -= 1;
    if(resources.length < state.maxResources){
      // find random tunnel cell
      let attempts = 0;
      while(attempts < 100){
        attempts++;
        const rx = Math.floor(Math.random()*state.cols);
        const ry = Math.floor(Math.random()*state.rows);
        const c = grid[ry][rx];
        if(c.type === CELL.TUNNEL && !resources.find(r=>r.x===rx && r.y===ry)){
          resources.push({x:rx,y:ry,life:30 + Math.random()*90});
          break;
        }
      }
    }
  }

  // Humans act: move towards tunnels and vandalize
  for(let h of humans){
    if(!h.active) continue;
    // tick down any tag debuff
    if(h.tagged && h.tagged > 0) h.tagged = Math.max(0, h.tagged - simDt);

    // find nearest tunnel by random local search
    if(Math.random() < 0.2){
      // random move near current
      const n = neighbors(h.x,h.y);
      const pick = n[Math.floor(Math.random()*n.length)];
      h.x = pick[0]; h.y = pick[1];
    } else {
      // bias towards center tunnels
      const tx = Math.floor(state.cols/2), ty = Math.floor(state.rows/2);
      const p = randomWalkTowards(h.x,h.y,tx,ty);
      h.x = p[0]; h.y = p[1];
    }

    // if on a tunnel, vandalize: lower health, raise corruption and contamination
    const cell = grid[h.y][h.x];
    if(cell.type === CELL.TUNNEL && cell.health > 0){
      const attack = (0.5 + Math.random()*0.5) * state.humanAggressiveness * (1 + state.corruption);
      cell.health = Math.max(0, cell.health - attack * simDt * 0.6);
      // when humans improvise, contamination spikes (fires, spills) and corruption increases
      cell.corrupt = Math.min(1, cell.corrupt + state.corruptionStrength * attack * simDt * 0.6);
      // contamination increases globally and locally (fires, mess)
      cell.sprawl = Math.max(0, cell.sprawl - 0.02 * simDt * (0.5 + Math.random()*0.5)); // vandalism can strip sprawl
      state.contamination = Math.min(1, state.contamination + 0.0015 * attack * simDt + 0.0008 * Math.random());
      state.power = Math.max(0, state.power - 0.02 * attack * simDt * 3);
      h.life -= simDt * (0.2 + state.corruption*0.8);
      if(h.life <= 0) h.active = false;
      // if destroyed, mark blocked
      if(cell.health <= 0) cell.type = CELL.BLOCKED;
    }
  }

  // Alien behaviors by type
  for(let i = aliens.length - 1; i >= 0; i--){
    const a = aliens[i];
    a.timer += simDt;
    // simple death check
    if(a.hp <= 0){
      // SKITTER death triggers caustic splash
      if(a.type === BUG.SKITTER){
        // damage nearby humans and bots and electronics (power/integrity)
        for(const h of humans){ if(h.active && Math.abs(h.x - a.x) + Math.abs(h.y - a.y) <= 2){ h.active = false; } }
        for(const b of aliens){ if(b!==a && Math.abs(b.x - a.x) + Math.abs(b.y - a.y) <= 2){ b.hp -= 30; } }
        state.power = Math.max(0, state.power - 6);
      }
      // corpse can be converted by Graftling to make a NestPod or resource; remove entity
      aliens.splice(i,1);
      continue;
    }

    // Movement helpers
    const moveTowards = (tx,ty, speedBias=1)=>{
      const p = randomWalkTowards(a.x,a.y,tx,ty);
      a.x = p[0]; a.y = p[1];
    };

    // Behavior per type
    if(a.type === BUG.RAPTOR){
      // medium speed, seeks nearest human; on first contact does pounce: capture drag -> convert human to 'sprawl' placed on grid
      // detect nearest human
      let target = null, bestD = 1e9;
      for(const h of humans){ if(!h.active) continue; const d = Math.abs(h.x-a.x)+Math.abs(h.y-a.y); if(d<bestD){bestD=d; target=h;} }
      if(target){
        moveTowards(target.x,target.y);
        const dist = Math.abs(a.x-target.x)+Math.abs(a.y-target.y);
        if(dist <= 1 && !a.state.pounced){
          // pounce: capture human, convert to sprawl (deads)
          target.active = false;
          // spawn sprawl on nearby tunnel cells (increase sprawl)
          const cell = grid[target.y][target.x];
          if(cell && cell.type === CELL.TUNNEL) cell.sprawl = Math.min(1, cell.sprawl + 0.35);
          // raptor loses a bit of hp (struggle) but marks as pounced for a cooldown
          a.hp = Math.max(0, a.hp - 2);
          a.state.pounced = true;
          a.timer = 0;
        }
        if(a.state.pounced && a.timer > 3){
          a.state.pounced = false;
          a.timer = 0;
        }
      } else {
        // wander
        const n = neighbors(a.x,a.y);
        const pick = n[Math.floor(Math.random()*n.length)];
        a.x = pick[0]; a.y = pick[1];
      }
    } else if(a.type === BUG.GRAFT){
      // carrier/worker: hauls bodies (inactive humans), grows sprawl, maintains NestPods and Pupa Nodes
      // look for dead human corpses (inactive with 0 life) nearby - treat inactive humans as haul targets
      let corpse = null, cdist = 1e9;
      for(const h of humans){ if(!h.active && h.life <= 0){ const d = Math.abs(h.x-a.x)+Math.abs(h.y-a.y); if(d<cdist){cdist=d; corpse=h;} } }
      if(corpse){
        moveTowards(corpse.x, corpse.y);
        if(Math.abs(a.x-corpse.x)+Math.abs(a.y-corpse.y) <= 1){
          // pick up and convert to sprawl/grow nest or heal nearby pod
          const cell = grid[corpse.y][corpse.x];
          if(cell && cell.type === CELL.TUNNEL){
            // Tagged hosts process faster into biomass (increase sprawl more) and can trigger ScavengeBug spawning
            if(corpse.tagged && corpse.tagged > 0){
              cell.sprawl = Math.min(1, cell.sprawl + 0.45);
              // chance to spawn a ScavengeBug when processing a tagged host
              if(Math.random() < 0.35){
                aliens.push({type:BUG.SCAVENGE, x:corpse.x, y:corpse.y, hp:40, state:{feedTimer:10}, timer:0});
              }
            } else {
              cell.sprawl = Math.min(1, cell.sprawl + 0.18);
              // smaller chance to spawn scavenge from normal conversion
              if(Math.random() < 0.06) aliens.push({type:BUG.SCAVENGE, x:corpse.x, y:corpse.y, hp:40, state:{feedTimer:10}, timer:0});
            }
            // chance to create a Nest Pod from a corpse
            if(Math.random() < 0.12){
              aliens.push({type:BUG.NESTPOD, x:corpse.x, y:corpse.y, hp:80, state:{open:false,spawnTimer:0}, timer:0});
            }
          }
          // remove corpse (simulate hauling)
          const idx = humans.indexOf(corpse);
          if(idx>=0) humans.splice(idx,1);
        }
      } else {
        // maintain: repair nearby pupa nodes or nest pods: heal them slowly
        let acted = false;
        for(const b of aliens){
          if((b.type === BUG.NESTPOD || b.type === BUG.PUPA) && Math.abs(b.x - a.x) + Math.abs(b.y - a.y) <= 2){
            b.hp = Math.min(200, b.hp + 8 * simDt);
            acted = true;
            break;
          }
        }
        if(!acted){
          // wander with bias to tunnels with low health
          let best=null, bestd=1e9;
          for(let y=0;y<state.rows;y++) for(let x=0;x<state.cols;x++){
            const c = grid[y][x];
            if(c.type === CELL.TUNNEL && c.health < 0.9){
              const d = Math.abs(a.x-x)+Math.abs(a.y-y);
              if(d < bestd){ bestd=d; best=[x,y]; }
            }
          }
          if(best) moveTowards(best[0],best[1]);
          else { const n = neighbors(a.x,a.y); const pick = n[Math.floor(Math.random()*n.length)]; a.x = pick[0]; a.y = pick[1]; }
        }
      }
    } else if(a.type === BUG.NESTPOD){
      // stationary ambush: opens when prey enters strike range, spawns Skitterling
      a.state.spawnTimer = (a.state.spawnTimer || 0) + simDt;
      // check for nearby humans or bots
      let preyNear = false;
      for(const h of humans){ if(h.active && Math.abs(a.x-h.x)+Math.abs(a.y-h.y) <= 2) preyNear = true; }
      if(preyNear && a.state.spawnTimer > 1.5){
        // spawn a skitterling
        aliens.push({type:BUG.SKITTER, x:a.x, y:a.y, hp:15, state:{life:6}, timer:0});
        a.state.spawnTimer = 0;
      }
      // nest pods can be damaged by humans; they don't move
    } else if(a.type === BUG.SKITTER){
      // fast fragile; seeks nearest human or bot; short-lived outside nest pod. on death emits caustic splash handled at death
      a.state.life -= simDt;
      // skitter will die if life finishes
      if(a.state.life <= 0){
        a.hp = 0; // mark for removal and caustic splash
        continue;
      }
      // seek nearest human
      let target = null, bestD = 1e9;
      for(const h of humans){ if(!h.active) continue; const d = Math.abs(h.x-a.x)+Math.abs(h.y-a.y); if(d<bestD){bestD=d; target=h;} }
      if(target){
        // move twice per tick: quick
        for(let k=0;k<1;k++){
          const p = randomWalkTowards(a.x,a.y,target.x,target.y);
          a.x = p[0]; a.y = p[1];
        }
        if(Math.abs(a.x-target.x)+Math.abs(a.y-target.y) <= 1){
          // latch: damage and reduce human life strongly
          target.life -= 8 * simDt;
          a.hp -= 5 * simDt; // fragile
        }
      } else {
        // wander briefly
        const n = neighbors(a.x,a.y);
        const pick = n[Math.floor(Math.random()*n.length)];
        a.x = pick[0]; a.y = pick[1];
      }
    } else if(a.type === BUG.SCAVENGE){
      // must feed within a timer or withers; after feeding becomes a Pupa Node
      a.state.feedTimer = (a.state.feedTimer || 12) - simDt;
      // try to find resource or human corpse
      let fed = false;
      // prefer resources
      for(let ri=0; ri<resources.length; ri++){
        const r = resources[ri];
        if(Math.abs(r.x - a.x) + Math.abs(r.y - a.y) <= 1){
          resources.splice(ri,1);
          a.state.feedTimer += 10;
          fed = true;
          break;
        }
      }
      if(!fed){
        // check for inactive humans to feed on
        for(let hi=0; hi<humans.length; hi++){
          const h = humans[hi];
          if(!h.active && Math.abs(h.x - a.x) + Math.abs(h.y - a.y) <= 1){
            // consume corpse -> become pupa
            humans.splice(hi,1);
            a.type = BUG.PUPA;
            a.hp = 100;
            a.timer = 0;
            a.state = {incubate:10};
            fed = true;
            break;
          }
        }
      }
      if(a.state.feedTimer <= 0){
        // wither and die
        a.hp = 0;
        continue;
      }
      // move to find food
      if(!fed){
        // scout fast
        const n = neighbors(a.x,a.y);
        const pick = n[Math.floor(Math.random()*n.length)];
        a.x = pick[0]; a.y = pick[1];
      }
    } else if(a.type === BUG.PUPA){
      // stationary timer; if in high-sprawl density, contributes to Matron emergence
      a.state.incubate = (a.state.incubate || 10) - simDt;
      // increase sprawl of cell gently
      const cell = grid[a.y][a.x];
      if(cell && cell.type === CELL.TUNNEL) cell.sprawl = Math.min(1, cell.sprawl + 0.02 * simDt);
      if(a.state.incubate <= 0){
        // chance to become matron if local sprawl density high
        let sprawlSum = 0, count=0;
        for(const [nx,ny] of neighbors(a.x,a.y)){ const c = grid[ny][nx]; if(c && c.type===CELL.TUNNEL){ sprawlSum += c.sprawl; count++; } }
        const density = count? sprawlSum/count : 0;
        if(density > 0.5 && Math.random() < density){
          a.type = BUG.MATRON;
          a.hp = 350;
          a.state = {laying:false, consumeBuffer:0};
        } else {
          // otherwise spawn a nest pod nearby
          aliens.push({type:BUG.NESTPOD, x:a.x, y:a.y, hp:80, state:{open:false,spawnTimer:0}, timer:0});
          // pupa converts to nest pod
          a.hp = 0; // remove pupa
        }
      }
    } else if(a.type === BUG.MATRON){
      // slow, durable. Cannot lay while moving. Produces Nest Pods by converting consumed hosts (1 host -> 1 pod).
      // Consume nearby dead humans or captured hosts to produce pods
      a.state.moveCooldown = a.state.moveCooldown || 0;
      a.state.moveCooldown -= simDt;
      // Find nearby inactive human corpses to consume
      for(let hi=humans.length-1; hi>=0; hi--){
        const h = humans[hi];
        if(!h.active && Math.abs(h.x - a.x) + Math.abs(h.y - a.y) <= 2){
          // consume
          humans.splice(hi,1);
          a.state.consumeBuffer = (a.state.consumeBuffer || 0) + 1;
        }
      }
      // If has consumeBuffer, convert to nest pods slowly
      if(a.state.consumeBuffer > 0 && a.state.timer > 2){
        // convert one host to pod
        aliens.push({type:BUG.NESTPOD, x:a.x, y:a.y, hp:100, state:{open:false,spawnTimer:0}, timer:0});
        a.state.consumeBuffer--;
        a.state.timer = 0;
      }
      a.state.timer += simDt;
      // matron moves rarely and slowly
      if(Math.random() < 0.02 * simDt){
        const n = neighbors(a.x,a.y);
        const pick = n[Math.floor(Math.random()*n.length)];
        a.x = pick[0]; a.y = pick[1];
      }
    }
    // small passive interactions: sprawl increases corruption slightly and reduces contamination over time (maintenance)
    const cellHere = grid[a.y][a.x];
    if(cellHere && cellHere.type === CELL.TUNNEL){
      // maintenance actions: GRAFT (carrier) slightly builds sprawl and reduces local contamination
      if(a.type === BUG.GRAFT){
        cellHere.sprawl = Math.min(1, cellHere.sprawl + 0.005 * simDt);
        state.contamination = Math.max(0, state.contamination - 0.0008 * simDt);
      }
      if(a.type === BUG.SKITTER) cellHere.corrupt = Math.min(1, cellHere.corrupt + 0.01 * simDt);
    }
  }

  // Corruption spreads: cells with corrupt>0 spread to neighbors and weaken health
  let totalCorrupt = 0;
  let totalSprawl = 0;
  for(let y=0;y<state.rows;y++){
    for(let x=0;x<state.cols;x++){
      const c = grid[y][x];
      if(c.type===CELL.TUNNEL){
        // spread (modulated by new corruptionSpreadIntensity)
        for(const [nx,ny] of neighbors(x,y)){
          const ncell = grid[ny][nx];
          if(ncell.type===CELL.TUNNEL){
            const spread = c.corrupt * 0.05 * state.corruptionStrength * state.corruptionSpreadIntensity * simDt;
            ncell.corrupt = Math.min(1, ncell.corrupt + spread);
          }
        }
        // corruption degrades health
        if(c.corrupt > 0.01){
          c.health = Math.max(0, c.health - c.corrupt * 0.02 * simDt);
          if(c.health <= 0) c.type = CELL.BLOCKED;
        }
        // sprawl increases corruption slowly
        if(c.sprawl > 0.01){
          c.corrupt = Math.min(1, c.corrupt + c.sprawl * 0.002 * simDt);
        }
        totalCorrupt += c.corrupt;
        totalSprawl += c.sprawl;
      }
    }
  }
  // system-level corruption metric
  state.corruption = Math.min(1, totalCorrupt / (state.cols*state.rows*0.06));

  // compute sprawl percent for UI
  const avgSprawl = (totalSprawl / Math.max(1, state.cols*state.rows)) * 100;
  // Alert: based on human aggressiveness and active human count (higher -> more alert)
  const activeHumans = humans.filter(h=>h.active).length;
  const alertVal = Math.min(1, state.humanAggressiveness * 0.7 + (activeHumans / Math.max(1, state.maxHumans)) * 0.6);
  // Host Supply: active humans + a scaled reserve
  const hostSupply = Math.max(0, Math.floor(activeHumans + (humans.filter(h=>!h.active).length * 0.2)));

  // integrity decreases with corruption and blocked tunnels fraction
  let blocked=0, tunnels=0;
  for(let y=0;y<state.rows;y++) for(let x=0;x<state.cols;x++){
    const c = grid[y][x];
    if(c.type===CELL.TUNNEL) tunnels++;
    if(c.type===CELL.BLOCKED) blocked++;
  }
  const blockedFrac = blocked / Math.max(1, (state.cols*state.rows));
  state.integrity = Math.max(0, 100 - (state.corruption*60 + blockedFrac*80*state.corruption));
  // power drains over time and when corruption high
  state.power = Math.max(0, state.power - (0.01 + state.corruption*0.1) * simDt * 10);

  // Victory/defeat checks
  if(state.integrity <= 5 || state.power <= 0){
    // game over: humans take over / corruption wins
    state.running = false;
  }

  // Clean up inactive humans occasionally, and enforce max counts
  if(Math.random() < simDt*0.3){
    humans = humans.filter(h=>h.active || h.life>0);
  }
  // enforce caps
  if(humans.length > state.maxHumans) humans.length = state.maxHumans;
  if(aliens.length > state.maxBots) aliens.length = state.maxBots;

  // age resources slightly and remove expired
  for(let i = resources.length-1; i>=0; i--){
    resources[i].life -= simDt;
    if(resources[i].life <= 0) resources.splice(i,1);
  }

  // update UI
  // update sector meters
  // contamination evolves from human actions and is reduced by sprawl/maintenance
  state.contamination = Math.min(1, Math.max(0, state.contamination));
  // control is a tug-of-war: sprawl and swarm presence vs active humans and contamination
  // compute a simple control signal (0..1)
  const sprawlInfluence = (avgSprawl/100) * 1.5;
  const humanInfluence = (activeHumans / Math.max(1, state.maxHumans)) * 1.2;
  const contamInfluence = state.contamination * 0.9;
  state.control = Math.min(1, Math.max(0, sprawlInfluence / (sprawlInfluence + humanInfluence + contamInfluence + 0.0001)));

  ui.time.textContent = Math.floor(state.time);
  ui.power.textContent = Math.floor(state.power);
  ui.integrity.textContent = Math.floor(state.integrity);
  ui.corrupt.textContent = Math.floor(state.corruption*100);
  ui.contam.textContent = Math.floor(state.contamination*100);
  ui.control.textContent = Math.floor(state.control*100);
  ui.sprawl.textContent = Math.floor(avgSprawl);
  ui.alert.textContent = Math.floor(alertVal*100);
  ui.hostsupply.textContent = hostSupply;
}

// Rendering
function render(){
  ctx.clearRect(0,0,W,H);
  // background
  ctx.fillStyle = "#050505";
  ctx.fillRect(0,0,W,H);

  const cs = state.cellSize;
  const ox = Math.floor((W - cs*state.cols)/2);
  const oy = Math.floor((H - cs*state.rows)/2);

  // draw cells
  for(let y=0;y<state.rows;y++){
    for(let x=0;x<state.cols;x++){
      const c = grid[y][x];
      const rx = ox + x*cs, ry = oy + y*cs;
      if(c.type === CELL.TUNNEL){
        // base tunnel
        const grey = 200 - Math.floor((1 - c.health)*120);
        ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
        ctx.fillRect(rx,ry,cs-1,cs-1);
        // Corruption / Swarm conduit overlay (brassy, cable mats)
        if(c.sprawl > 0.01){
          ctx.fillStyle = `rgba(205,163,74,${Math.min(0.9,c.sprawl*1.2)})`; // brass tone
          ctx.fillRect(rx,ry,cs-1,cs-1);
        }
        // signal / corruption glow overlay (teal-ish)
        if(c.corrupt > 0.01){
          ctx.fillStyle = `rgba(123,230,217,${Math.min(0.9,c.corrupt*1.2)})`; // signal glow
          ctx.fillRect(rx,ry,cs-1,cs-1);
        }
      } else if(c.type === CELL.BLOCKED){
        ctx.fillStyle = "#6b6b6b";
        ctx.fillRect(rx,ry,cs-1,cs-1);
      } else {
        // empty rock
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(rx,ry,cs-1,cs-1);
      }
    }
  }

  // draw resources
  for(const r of resources){
    const rx = ox + r.x*cs + cs*0.36, ry = oy + r.y*cs + cs*0.36;
    const size = cs*0.28;
    ctx.fillStyle = "#ffd86b";
    ctx.beginPath();
    ctx.arc(rx+size/2, ry+size/2, size*0.6, 0, Math.PI*2);
    ctx.fill();
  }

  // draw aliens with per-type visuals
  for(let a of aliens){
    const rx = ox + a.x*cs + cs*0.12, ry = oy + a.y*cs + cs*0.12;
    const size = cs*0.76;
    if(a.type === BUG.RAPTOR){
      ctx.fillStyle = "#b3ff9f";
      ctx.beginPath();
      ctx.ellipse(rx+size/2, ry+size/2, size*0.48, size*0.35, 0.2, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#5e8f4a";
      if(a.state && a.state.pounced) ctx.fillRect(rx+size*0.1, ry+size*0.05, size*0.25, size*0.25);
    } else if(a.type === BUG.GRAFT){
      ctx.fillStyle = "#7fffd4";
      ctx.beginPath();
      ctx.ellipse(rx+size/2, ry+size/2, size*0.36, size*0.36, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(rx+size*0.05, ry+size*0.6, size*0.6, size*0.18);
    } else if(a.type === BUG.NESTPOD){
      ctx.fillStyle = "#4bff88";
      ctx.beginPath();
      ctx.arc(rx+size/2, ry+size/2, size*0.45, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#003300";
      ctx.fillRect(rx+size*0.2, ry+size*0.3, size*0.6, size*0.4);
    } else if(a.type === BUG.SKITTER){
      ctx.fillStyle = "#ffb3d9";
      ctx.beginPath();
      ctx.ellipse(rx+size/2, ry+size/2, size*0.25, size*0.18, 0, 0, Math.PI*2);
      ctx.fill();
    } else if(a.type === BUG.SCAVENGE){
      ctx.fillStyle = "#ffd86b";
      ctx.beginPath();
      ctx.ellipse(rx+size/2, ry+size/2, size*0.34, size*0.22, 0, 0, Math.PI*2);
      ctx.fill();
    } else if(a.type === BUG.PUPA){
      ctx.fillStyle = "#a3ffef";
      ctx.beginPath();
      ctx.ellipse(rx+size/2, ry+size/2, size*0.28, size*0.4, 0, 0, Math.PI*2);
      ctx.fill();
    } else if(a.type === BUG.MATRON){
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.ellipse(rx+size/2, ry+size/2, size*0.6, size*0.5, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(rx+size*0.1, ry+size*0.75, size*0.8, size*0.12);
    }
  }

  // draw humans
  for(let h of humans){
    if(!h.active) {
      // corpse marker
      const rx = ox + h.x*cs + cs*0.3, ry = oy + h.y*cs + cs*0.3;
      ctx.fillStyle = "rgba(120,80,80,0.9)";
      ctx.fillRect(rx,ry,cs*0.4,cs*0.12);
      // if corpse was tagged recently, show faint marker
      if(h.tagged && h.tagged > 0){
        ctx.strokeStyle = "rgba(255,150,200,0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rx-2, ry-2, cs*0.44, cs*0.16);
      }
      continue;
    }
    const rx = ox + h.x*cs + cs*0.22, ry = oy + h.y*cs + cs*0.22;
    const size = cs*0.56;
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(rx,ry,size,size);
    // show tag debuff as a small ring if present
    if(h.tagged && h.tagged > 0){
      ctx.strokeStyle = "rgba(255,180,220,0.95)";
      ctx.lineWidth = Math.max(1, cs*0.06);
      ctx.beginPath();
      ctx.arc(rx+size/2, ry+size/2, size*0.65, 0, Math.PI*2);
      ctx.stroke();
    }
  }

  // overlay HUD if paused or ended
  if(!state.running){
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#ffb86b";
    ctx.font = `${Math.max(16, Math.floor(W*0.04))}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(state.integrity <= 5 || state.power <= 0 ? "HUMANS / SWARM WIN" : "PAUSED", W/2, H/2);
  }
}

// Main loop
let last = performance.now();
function loop(t){
  const dt = (t - last)/1000;
  last = t;
  if(state.running){
    step(dt);
  }
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Touch to interact: tap to place temporary barricade (sacrifice power) to block humans
canvas.addEventListener('pointerdown', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left - (W - state.cellSize*state.cols)/2) / state.cellSize);
  const y = Math.floor((e.clientY - rect.top - (H - state.cellSize*state.rows)/2) / state.cellSize);
  if(x>=0 && x<state.cols && y>=0 && y<state.rows){
    const cell = grid[y][x];
    // use power to create a barricade: costs power, sets blocked but increases corruption slightly
    if(state.power > 5 && cell.type === CELL.TUNNEL){
      cell.type = CELL.BLOCKED;
      cell.health = 0;
      cell.corrupt = Math.min(1, cell.corrupt + 0.2);
      state.power = Math.max(0, state.power - 8);
    } else if(cell.type === CELL.BLOCKED){
      // attempt to clear a blocked cell (costly)
      if(state.power > 12){
        cell.type = CELL.TUNNEL;
        cell.health = 0.4;
        cell.corrupt = 0.3;
        state.power = Math.max(0, state.power - 12);
      }
    }
  }
});

// keyboard shortcuts (desktop)
addEventListener('keydown', (e)=>{
  if(e.key === ' ') { state.running = !state.running; ui.pause.textContent = state.running ? 'Pause' : 'Resume'; e.preventDefault(); }
  if(e.key === 'r') initSim();
});