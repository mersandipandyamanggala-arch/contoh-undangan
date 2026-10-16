/* =========================================================
   1. NAMA TAMU DARI URL (?to=Nama+Tamu)
   ========================================================= */
(function(){
  const params = new URLSearchParams(window.location.search);
  const to = params.get('to');
  if(to){
    document.getElementById('guestName').textContent =
      decodeURIComponent(to.replace(/\+/g,' '));
  }
})();

/* =========================================================
   2. BUKA UNDANGAN + AUTOPLAY MUSIK
   ========================================================= */
const cover    = document.getElementById('cover');
const main     = document.getElementById('main');
const music    = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');

document.getElementById('openBtn').addEventListener('click', function(){
  cover.classList.add('hide');
  document.body.classList.remove('locked');
  main.classList.add('show');
  window.scrollTo(0,0);

  // Autoplay musik setelah interaksi user
  music.volume = 0.55;
  const playPromise = music.play();
  if(playPromise !== undefined){
    playPromise.then(()=>{
      musicBtn.classList.add('playing');
    }).catch(()=>{
      // Browser memblokir autoplay -> user tinggal klik tombol musik
      musicBtn.classList.remove('playing');
    });
  }

  // Jalankan animasi reveal setelah dibuka
  setTimeout(initReveal, 300);
});

/* Tombol musik on/off */
musicBtn.addEventListener('click', function(){
  if(music.paused){
    music.play();
    musicBtn.classList.add('playing');
  }else{
    music.pause();
    musicBtn.classList.remove('playing');
  }
});

/* =========================================================
   3. COUNTDOWN (HARI : JAM : MENIT : DETIK)
   ========================================================= */
const targetDate = new Date('2027-11-28T11:00:00').getTime();

function pad(n){ return n < 10 ? '0' + n : '' + n; }

function updateCountdown(){
  const now  = new Date().getTime();
  const diff = targetDate - now;

  const elD = document.getElementById('cd-d');
  const elH = document.getElementById('cd-h');
  const elM = document.getElementById('cd-m');
  const elS = document.getElementById('cd-s');

  if(diff <= 0){
    elD.textContent = '00';
    elH.textContent = '00';
    elM.textContent = '00';
    elS.textContent = '00';
    return;
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  elD.textContent = pad(d);
  elH.textContent = pad(h);
  elM.textContent = pad(m);
  elS.textContent = pad(s);
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* =========================================================
   4. REVEAL ANIMASI SAAT SCROLL
   ========================================================= */
function initReveal(){
  const items = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(function(el){ observer.observe(el); });
}

/* =========================================================
   5. SALIN NOMOR REKENING
   ========================================================= */
function showToast(msg){
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> toast.classList.remove('show'), 2200);
}

document.querySelectorAll('.btn-copy').forEach(function(btn){
  btn.addEventListener('click', function(){
    const nomor = this.getAttribute('data-copy');

    const doFallback = function(){
      const temp = document.createElement('textarea');
      temp.value = nomor;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try{ document.execCommand('copy'); }catch(e){}
      document.body.removeChild(temp);
    };

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(nomor)
        .then(()=> showToast('Nomor rekening berhasil disalin!'))
        .catch(()=>{ doFallback(); showToast('Nomor rekening berhasil disalin!'); });
    }else{
      doFallback();
      showToast('Nomor rekening berhasil disalin!');
    }

    const original = this.innerHTML;
    this.innerHTML = '<i class="bi bi-check2 me-1"></i> Tersalin!';
    this.classList.add('done');
    setTimeout(()=>{
      this.innerHTML = original;
      this.classList.remove('done');
    }, 2000);
  });
});

/* =========================================================
   6. RSVP — SIMPAN & TAMPILKAN UCAPAN
   ========================================================= */
let wishes = [
  {
    nama: 'Keluarga Besar Wijaya',
    hadir: 'Hadir',
    pesan: 'Barakallahu lakuma wa baraka alaikuma wa jama\'a bainakuma fii khairin. Selamat menempuh hidup baru, semoga menjadi keluarga sakinah, mawaddah, warahmah.',
    waktu: new Date(Date.now() - 1000*60*60*5)
  },
  {
    nama: 'Dinda & Fajar',
    hadir: 'Hadir',
    pesan: 'Selamat ya kalian berdua! Akhirnya sampai di titik ini juga. Semoga langgeng sampai kakek nenek ya!',
    waktu: new Date(Date.now() - 1000*60*60*2)
  },
  {
    nama: 'Rizky Pratama',
    hadir: 'Tidak Hadir',
    pesan: 'Maaf belum bisa hadir karena masih di luar kota. Doa terbaik dari jauh untuk kalian berdua. Bahagia selalu!',
    waktu: new Date(Date.now() - 1000*60*30)
  }
];

const wishList    = document.getElementById('wishList');
const totalUcapan = document.getElementById('totalUcapan');
const totalHadir  = document.getElementById('totalHadir');

function waktuRelatif(date){
  const selisih = Math.floor((Date.now() - date.getTime()) / 1000);
  if(selisih < 60) return 'Baru saja';
  if(selisih < 3600) return Math.floor(selisih/60) + ' menit lalu';
  if(selisih < 86400) return Math.floor(selisih/3600) + ' jam lalu';
  return Math.floor(selisih/86400) + ' hari lalu';
}

function badgeClass(h){
  if(h === 'Hadir') return 'badge-hadir';
  if(h === 'Tidak Hadir') return 'badge-tidak';
  return 'badge-ragu';
}

function renderWishes(){
  wishList.innerHTML = '';

  if(wishes.length === 0){
    wishList.innerHTML = '<p style="color:var(--silver); font-size:.85rem; text-align:center; padding:20px 0;">Belum ada ucapan. Jadilah yang pertama!</p>';
  }

  wishes.forEach(function(w){
    const div = document.createElement('div');
    div.className = 'wish-item';
    div.innerHTML = `
      <div class="wish-head">
        <span class="wname">${escapeHtml(w.nama)}</span>
        <span class="${badgeClass(w.hadir)}">${escapeHtml(w.hadir)}</span>
      </div>
      <div class="wtime">${waktuRelatif(w.waktu)}</div>
      <div class="wmsg">${escapeHtml(w.pesan)}</div>
    `;
    wishList.appendChild(div);
  });

  totalUcapan.textContent = wishes.length;
  totalHadir.textContent  = wishes.filter(w => w.hadir === 'Hadir').length;
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

document.getElementById('rsvpForm').addEventListener('submit', function(e){
  e.preventDefault();

  const nama  = document.getElementById('inNama').value.trim();
  const hadir = document.getElementById('inHadir').value;
  const pesan = document.getElementById('inPesan').value.trim();

  if(!nama || !hadir || !pesan){
    showToast('Mohon lengkapi semua data terlebih dahulu.');
    return;
  }

  wishes.unshift({
    nama: nama,
    hadir: hadir,
    pesan: pesan,
    waktu: new Date()
  });

  renderWishes();
  this.reset();
  showToast('Terima kasih! Ucapan Anda telah terkirim.');

  wishList.scrollTop = 0;
});

renderWishes();

/* =========================================================
   7. MODAL GALERI
   ========================================================= */
const modalFoto = document.getElementById('modalFoto');
if(modalFoto){
  modalFoto.addEventListener('show.bs.modal', function(event){
    const trigger = event.relatedTarget;
    if(trigger){
      const src = trigger.getAttribute('data-img');
      document.getElementById('modalImg').src = src;
    }
  });
}

/* =========================================================
   8. HIGHLIGHT NAV AKTIF SAAT SCROLL
   ========================================================= */
const navLinks = document.querySelectorAll('.bottom-nav a');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', function(){
  let current = '';
  const scrollPos = window.scrollY + window.innerHeight / 3;

  sections.forEach(function(sec){
    if(scrollPos >= sec.offsetTop){
      current = sec.getAttribute('id');
    }
  });

  navLinks.forEach(function(link){
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
});