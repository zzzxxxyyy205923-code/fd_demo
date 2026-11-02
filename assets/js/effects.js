/* ═══════════════════════════════════════════════════════════
   视觉与动态效果：首屏轮播、Stories 视频轮播、首页内容带等高
   全部为纯交互逻辑，文案与素材清单来自 assets/data/*.json
═══════════════════════════════════════════════════════════ */

/* ─────────── Hero 轮播：单张依次切换 · 慢速左滑过场 · 自动循环不间断 ─────────── */
const HeroCarousel = {
  _timer: 0, _index: 1, _track: null, _animating: false, _slides: [],
  SLIDE_DURATION: 1000,   /* 关键参数：慢速左滑过场时长 ms */
  SLIDE_INTERVAL: 6000,   /* 关键参数：每张展示时长 ms（须大于过场时长） */
  EASE: 'cubic-bezier(.65,.05,.25,1)',   /* 缓入缓出，过场自然 */
  slide(src) {
    return `
      <div class="hero-slide">
        <img class="hero-slide__img hero-slide__img--base" src="${src}" alt="" draggable="false">
        <img class="hero-slide__img hero-slide__img--vivid" src="${src}" alt="" draggable="false">
      </div>`;
  },
  mount(slides) {
    this.stop();
    this._slides = Array.isArray(slides) ? slides : [];
    const track = document.getElementById('hero-track');
    if (!track || !this._slides.length) return;
    /* 首尾各加一张克隆帧：正向 / 反向翻页均可平滑过渡 */
    track.innerHTML = this.slide(this._slides[this._slides.length - 1]) +
      this._slides.map(s => this.slide(s)).join('') +
      this.slide(this._slides[0]);
    this._track = track;
    this._index = 1;
    this._apply(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this._startTimer();
  },
  _startTimer() {
    this._timer = setInterval(() => this.go(1), this.SLIDE_INTERVAL);
  },
  _apply(animate) {
    this._track.style.transition = animate ? `transform ${this.SLIDE_DURATION}ms ${this.EASE}` : 'none';
    this._track.style.transform = `translate3d(${-(this._index - 1) * 100}%, 0, 0)`;
  },
  /* dir = 1 下一张 / -1 上一张；越界后瞬时归位到对侧克隆帧，画面内容相同无感知 */
  go(dir) {
    if (this._animating || !this._track) return;
    this._animating = true;
    this._index += dir;
    this._apply(true);
    setTimeout(() => {
      if (!this._track) return;
      if (this._index > this._slides.length) { this._index = 1; this._apply(false); void this._track.offsetWidth; }
      else if (this._index < 1) { this._index = this._slides.length; this._apply(false); void this._track.offsetWidth; }
      this._animating = false;
    }, this.SLIDE_DURATION + 60);
  },
  /* 手动翻页：翻页后重置自动播放计时，避免刚切换就再次自动翻页 */
  prev() { this.go(-1); this._restartTimer(); },
  next() { this.go(1); this._restartTimer(); },
  _restartTimer() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(this._timer);
    this._startTimer();
  },
  /* 底部向下符号：平滑滚动至下一屏（Find a course） */
  scrollNext() {
    const el = document.querySelector('.card-grid')?.closest('section.section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = 0; }
    this._track = null; this._animating = false; this._index = 1;
  }
};

/* 主页内容带等高：STORIES / WHAT'S ON 总高对齐 Find a course
   仅调整分区自身的上下内边距，内部布局、元素排列与样式不变；随视口重算 */
function equalizeHomeBands() {
  const findSec = document.querySelector('.card-grid')?.closest('section.section');
  if (!findSec) return;
  const target = findSec.offsetHeight;
  document.querySelectorAll('.band--dark, .band--light').forEach(sec => {
    sec.style.paddingTop = '';
    sec.style.paddingBottom = '';
    const delta = sec.offsetHeight - target;
    if (delta === 0) return;
    const cs = getComputedStyle(sec);
    const half = Math.max(28, (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) - delta) / 2);
    sec.style.paddingTop = half + 'px';
    sec.style.paddingBottom = half + 'px';
  });
}
window.addEventListener('resize', equalizeHomeBands);

/* Stories 全屏视频轮播：板块内嵌视频逐个循环播放
   单视频时无缝 loop；补充多个视频后自动逐个切换、到末尾回到第一个 */
const StoriesReel = {
  _list: [], _i: 0,
  mount(stories) {
    const v = document.getElementById('stories-reel-video');
    if (!v) return;
    this._list = (stories || []).filter(s => s.video);
    this._i = 0;
    if (!this._list.length) return;
    v.loop = this._list.length === 1;
    v.onended = v.loop ? null : () => {
      this._i = (this._i + 1) % this._list.length;
      v.src = this._list[this._i].video;
      v.play().catch(() => {});
    };
    v.play().catch(() => {});
  },
  stop() {
    const v = document.getElementById('stories-reel-video');
    if (v) v.pause();
  }
};
