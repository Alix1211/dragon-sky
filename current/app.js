(() => {
  const nodes = [...document.querySelectorAll('.stage-node')];
  const stageCode = document.getElementById('stageCode');
  const stageName = document.getElementById('stageName');
  const stageDesc = document.getElementById('stageDesc');
  const sortieBtn = document.getElementById('sortieBtn');
  const toast = document.getElementById('toast');
  const modal = document.getElementById('modal');
  const modalCode = document.getElementById('modalCode');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');
  const cancelBtn = document.getElementById('cancelBtn');
  const confirmBtn = document.getElementById('confirmBtn');
  const storyBtn = document.getElementById('storyBtn');
  let selected = nodes[0];
  let toastTimer = 0;

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function selectNode(node){
    selected?.classList.remove('selected');
    selected = node;
    selected.classList.add('selected');
    stageCode.textContent = `STAGE ${node.dataset.stage}`;
    stageName.textContent = node.dataset.name;
    stageDesc.textContent = node.dataset.desc;
    sortieBtn.classList.add('ready');
    if (navigator.vibrate) navigator.vibrate(16);
  }
  nodes.forEach(node => node.addEventListener('click', () => selectNode(node)));

  sortieBtn.addEventListener('click', () => {
    modalCode.textContent = `STAGE ${selected.dataset.stage}`;
    modalTitle.textContent = selected.dataset.name;
    modalText.textContent = selected.dataset.stage === '1-1'
      ? '테스트 빌드: 1-1 출격 시 오프닝이 항상 재생됩니다.' : '출격하시겠습니까?';
    modal.hidden = false;
    if (navigator.vibrate) navigator.vibrate([22,35,22]);
  });
  cancelBtn.addEventListener('click', () => modal.hidden = true);
  modal.addEventListener('click', e => { if(e.target === modal) modal.hidden = true; });
  confirmBtn.addEventListener('click', () => {
    modal.hidden = true;
    if (selected.dataset.stage === '1-1') {
      startOpening(false);
    } else {
      launchStage(selected.dataset.stage);
    }
  });

  document.querySelectorAll('.nav-item, #chapterBtn, .mail').forEach(btn => {
    btn.addEventListener('click', () => showToast(`${btn.textContent.trim() || btn.title} 메뉴`));
  });
  storyBtn.addEventListener('click', () => startOpening(true));

  document.getElementById('settingsBtn').addEventListener('click', async () => {
    try{
      if(!document.fullscreenElement){ await document.documentElement.requestFullscreen(); showToast('전체화면 ON'); }
      else { await document.exitFullscreen(); showToast('전체화면 OFF'); }
    }catch{ showToast('브라우저 전체화면을 사용할 수 없습니다'); }
  });

  const stageRunner = document.getElementById('stageRunner');
  const stageFrame = document.getElementById('stageFrame');
  const forceExitStage = document.getElementById('forceExitStage');

  function launchStage(stage){
    if(stage !== '1-1'){
      showToast(`${stage} 전투는 아직 준비 중입니다`);
      return;
    }
    stageRunner.hidden = false;
    stageFrame.src = `stage1/index.html?stage=${encodeURIComponent(stage)}&t=${Date.now()}`;
    if (navigator.vibrate) navigator.vibrate([18,35,35]);
  }

  function exitStage(){
    if(stageRunner.hidden) return;
    if(!confirm('현재 스테이지를 강제로 종료하고 맵으로 돌아가시겠습니까?')) return;
    stageFrame.src = 'about:blank';
    stageRunner.hidden = true;
    showToast('STAGE 1-1 종료');
    if (navigator.vibrate) navigator.vibrate(24);
  }

  forceExitStage.addEventListener('click', exitStage);

  /* ---------- cinematic opening ---------- */
  const opening = document.getElementById('opening');
  const bgA = opening.querySelector('.bg-a');
  const bgB = opening.querySelector('.bg-b');
  const flash = opening.querySelector('.opening-flash');
  const title = document.getElementById('openingTitle');
  const caption = document.getElementById('openingCaption');
  const dialogue = document.getElementById('dialogue');
  const speakerName = document.getElementById('speakerName');
  const dialogueText = document.getElementById('dialogueText');
  const kael = document.getElementById('speakerKael');
  const silitra = document.getElementById('speakerSilitra');
  const cinemaVideo = document.getElementById('cinemaVideo');
  const skipOpening = document.getElementById('skipOpening');

  let sceneIndex = -1;
  let sceneTimer = 0;
  let typeTimer = 0;
  let openingReplay = false;
  let currentBg = 'a';
  let typing = false;
  let fullText = '';
  let videoToken = 0;

  const seq = [
    {kind:'video', src:'assets/cinema_duel_01.mp4', ms:1700},
    {kind:'talk', bg:'assets/opening_duel.png', who:'kael', name:'카엘', text:'이번엔 끝내죠, 실리트라.'},
    {kind:'talk', bg:'assets/opening_duel.png', who:'silitra', name:'실리트라', text:'몇 번을 덤벼도 결과는 같아, 인간.'},

    {kind:'video', src:'assets/cinema_duel_02.mp4', ms:1700},
    {kind:'talk', bg:'assets/opening_duel.png', who:'kael', name:'카엘', text:'그런 것치곤 오늘도 승부가 안 나는데요?'},
    {kind:'talk', bg:'assets/opening_duel.png', who:'silitra', name:'실리트라', text:'입만은 정말—'},

    {kind:'video', src:'assets/cinema_invasion_reveal.mp4', ms:2900, impact:true},
    {kind:'talk', bg:'assets/opening_swarm.png', who:'kael', name:'카엘', text:'…엇. 저건 뭐지?'},
    {kind:'talk', bg:'assets/opening_swarm.png', who:'silitra', name:'실리트라', text:'저건… 이 세계의 것이 아니다.'},

    {kind:'video', src:'assets/cinema_invasion_attack.mp4', ms:2900, impact:true},
    {kind:'talk', bg:'assets/opening_attack.png', who:'kael', name:'카엘', text:'사람이고 드래곤이고 가리지 않는군요.'},
    {kind:'talk', bg:'assets/opening_attack.png', who:'silitra', name:'실리트라', text:'감히… 내 하늘을 더럽혀?'},
    {kind:'talk', bg:'assets/opening_attack.png', who:'kael', name:'카엘', text:'일단 저놈들부터 처리하죠.'},
    {kind:'talk', bg:'assets/opening_attack.png', who:'silitra', name:'실리트라', text:'좋아. 끝나면 다시 결판이다.'},
    {kind:'talk', bg:'assets/opening_attack.png', who:'kael', name:'카엘', text:'살아남으면요.'},
    {kind:'talk', bg:'assets/opening_attack.png', who:'silitra', name:'실리트라', text:'…흥.'},

    {kind:'final', bg:'assets/opening_silitra_battle.png', caption:'STAGE 1-1  ·  FIRST SYNC', ms:1800}
  ];

  function setBg(src){
    const next = currentBg === 'a' ? bgB : bgA;
    const prev = currentBg === 'a' ? bgA : bgB;
    next.style.backgroundImage = `url("${src}")`;
    next.classList.add('active');
    prev.classList.remove('active');
    currentBg = currentBg === 'a' ? 'b' : 'a';
  }

  function setSpeaker(who){
    kael.classList.remove('active','dim');
    silitra.classList.remove('active','dim');
    if(who === 'kael'){
      kael.classList.add('active');
      silitra.classList.add('dim');
    }else if(who === 'silitra'){
      silitra.classList.add('active');
      kael.classList.add('dim');
    }
  }
  function clearSpeaker(){
    kael.classList.remove('active','dim');
    silitra.classList.remove('active','dim');
  }

  function runFlash(){
    flash.classList.remove('go');
    void flash.offsetWidth;
    flash.classList.add('go');
    if(navigator.vibrate) navigator.vibrate([35,30,70]);
  }

  function typeLine(text){
    clearInterval(typeTimer);
    typing = true;
    fullText = text;
    dialogueText.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      dialogueText.textContent = text.slice(0, ++i);
      if(i >= text.length){
        clearInterval(typeTimer);
        typing = false;
      }
    }, 20);
  }

  function finishTyping(){
    if(!typing) return false;
    clearInterval(typeTimer);
    dialogueText.textContent = fullText;
    typing = false;
    return true;
  }

  function stopCinema(){
    videoToken++;
    cinemaVideo.pause();
    cinemaVideo.removeAttribute('src');
    cinemaVideo.load();
    cinemaVideo.classList.remove('show');
    opening.classList.remove('video-mode');
  }

  function playCinema(step){
    clearSpeaker();
    dialogue.hidden = true;
    caption.classList.remove('show');
    title.classList.remove('show');
    opening.classList.add('video-mode');
    cinemaVideo.classList.remove('show');

    const myToken = ++videoToken;
    cinemaVideo.src = step.src;
    cinemaVideo.currentTime = 0;
    cinemaVideo.muted = false;
    cinemaVideo.volume = .78;

    if(step.impact) runFlash();

    const goNext = () => {
      if(myToken !== videoToken) return;
      cinemaVideo.onended = null;
      cinemaVideo.onerror = null;
      cinemaVideo.classList.remove('show');
      setTimeout(() => {
        if(myToken !== videoToken) return;
        opening.classList.remove('video-mode');
        nextStep(true);
      }, 120);
    };

    cinemaVideo.onended = goNext;
    cinemaVideo.onerror = () => {
      cinemaVideo.muted = true;
      goNext();
    };

    const p = cinemaVideo.play();
    if(p && p.catch){
      p.catch(() => {
        cinemaVideo.muted = true;
        cinemaVideo.play().catch(goNext);
      });
    }
    requestAnimationFrame(() => cinemaVideo.classList.add('show'));
    sceneTimer = setTimeout(goNext, step.ms || 2500);
  }

  function showStep(){
    clearTimeout(sceneTimer);
    const s = seq[sceneIndex];
    if(!s){ endOpening(); return; }

    if(s.kind !== 'video'){
      stopCinema();
      setBg(s.bg);
      title.classList.remove('show');
      caption.classList.remove('show');
      dialogue.hidden = true;
      clearSpeaker();
    }

    if(s.kind === 'video'){
      playCinema(s);
    }else if(s.kind === 'talk'){
      dialogue.hidden = false;
      speakerName.textContent = s.name;
      setSpeaker(s.who);
      typeLine(s.text);
      sceneTimer = setTimeout(() => nextStep(true), Math.min(2550, Math.max(1850, 1200 + s.text.length * 43)));
    }else if(s.kind === 'final'){
      runFlash();
      title.classList.add('show');
      caption.textContent = s.caption;
      caption.classList.add('show');
      sceneTimer = setTimeout(endOpening, s.ms);
    }
  }

  function nextStep(autoAdvance = false){
    if(!autoAdvance && typing && finishTyping()) return;
    clearTimeout(sceneTimer);
    sceneIndex++;
    showStep();
  }

  function startOpening(replay){
    openingReplay = replay;
    sceneIndex = 0;
    currentBg = 'a';
    typing = false;
    bgA.classList.remove('active');
    bgB.classList.remove('active');
    opening.hidden = false;
    showStep();
  }

  function endOpening(){
    clearTimeout(sceneTimer);
    clearInterval(typeTimer);
    typing = false;
    stopCinema();
    opening.hidden = true;
    clearSpeaker();
    if(!openingReplay){
      // Test build: do not persist the opening-seen flag.
      launchStage('1-1');
    }else{
      showToast('오프닝 다시보기 종료');
    }
  }

  opening.addEventListener('pointerup', e => {
    if(e.target === skipOpening) return;
    if(opening.classList.contains('video-mode')){
      stopCinema();
      sceneIndex++;
      showStep();
      return;
    }
    nextStep(false);
  });

  skipOpening.addEventListener('click', e => {
    e.stopPropagation();
    endOpening();
  });

  window.addEventListener('keydown', e => {
    if(!stageRunner.hidden && e.key === 'Escape'){
      exitStage();
      return;
    }
    if(opening.hidden) return;
    if(e.key === 'Escape') endOpening();
    else if(e.key === ' ' || e.key === 'Enter'){
      if(opening.classList.contains('video-mode')){
        stopCinema();
        sceneIndex++;
        showStep();
      }else{
        nextStep(false);
      }
    }
  });

  selectNode(selected);
})();