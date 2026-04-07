const audio = document.getElementById("audio");
      const upload = document.getElementById("upload");
      const canvas = document.getElementById("visualizer");
      const coverDiv = document.getElementById("cover");
      const ctx = canvas.getContext("2d");
      let audioContext, source, analyser, filters = [],
        isInitialized = false;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // IMAGEM PADRÃO (Caso a música não tenha capa)
      const DEFAULT_COVER = "https://images.pexels.com/photos/4778314/pexels-photo-4778314.jpeg";

      function initAudio() {
        if (isInitialized) return;
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaElementSource(audio);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const freqs = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        filters = freqs.map(f => {
          let eq = audioContext.createBiquadFilter();
          eq.type = "peaking";
          eq.frequency.value = f;
          eq.Q.value = 1.4;
          eq.gain.value = 0;
          return eq;
        });
        let lastNode = source;
        filters.forEach(f => {
          lastNode.connect(f);
          lastNode = f;
        });
        lastNode.connect(analyser);
        analyser.connect(audioContext.destination);
        isInitialized = true;
        draw();
      }

      function draw() {
        requestAnimationFrame(draw);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let barWidth = (canvas.width / dataArray.length) * 2.5;
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
          let barHeight = dataArray[i] / 4;
          ctx.fillStyle = `hsl(${140 + (i * 2)}, 100%, 50%)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
        let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        document.body.style.background = `radial-gradient(circle, rgba(29,185,84,${avg/400}) 0%, #000 80%)`;
      }

      upload.addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) {
          // RESET VISUAL ANTES DE TUDO
          coverDiv.style.backgroundImage = `url(${DEFAULT_COVER})`;
          coverDiv.innerText = "";
          document.getElementById("title").innerText = "Carregando...";
          document.getElementById("artist").innerText = "---";

          audio.src = URL.createObjectURL(file);
          audio.play();
          initAudio();

          jsmediatags.read(file, {
            onSuccess: function(tag) {
              const t = tag.tags;
              document.getElementById("title").innerText = t.title || file.name.replace(/\.[^/.]+$/, "");
              document.getElementById("artist").innerText = t.artist || "Artista Desconhecido";

              if (t.picture) {
                let base64 = "";
                for (let i = 0; i < t.picture.data.length; i++) {
                  base64 += String.fromCharCode(t.picture.data[i]);
                }
                coverDiv.style.backgroundImage = `url(data:${t.picture.format};base64,${btoa(base64)})`;
                coverDiv.innerText = "";
              } else {
                // Se não tem foto própria, mantém a do Pexels
                coverDiv.style.backgroundImage = `url(${DEFAULT_COVER})`;
              }
            },
            onError: function() {
              document.getElementById("title").innerText = file.name;
              coverDiv.style.backgroundImage = `url(${DEFAULT_COVER})`;
            }
          });
        }
      });

      const presets = {
        flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        bass: [12, 10, 8, 4, 1, 0, 0, 0, 0, 0],
        rock: [6, 4, 3, 1, -1, -1, 1, 3, 4, 5],
        pop: [-1, 2, 4, 5, 3, 0, -1, -2, -2, -1],
        vocal: [-5, -3, -1, 2, 5, 6, 5, 2, 0, -3],
        jazz: [4, 3, 1, 3, -2, -2, 0, 2, 4, 4],
        acoustic: [5, 4, 3, 1, 3, 4, 5, 4, 3, 2],
        dance: [7, 9, 6, 0, 2, 4, 5, 4, 1, 0],
        small_speaker: [-10, -5, 0, 3, 5, 6, 5, 3, 0, -5],
        techno: [5, 9, 4, -2, -3, -1, 1, 4, 8, 10],
        lenta: [-4, -2, 0, 2, 4, 5, 4, 3, 2, 1],
        batidao: [15, 13, 10, 2, -2, -4, -2, 0, 3, 5]
      };

      document.getElementById("preset").addEventListener("change", e => {
        const v = presets[e.target.value];
        if (v) {
          document.querySelectorAll(".equalizer input").forEach((s, i) => {
            if (filters[i]) {
              s.value = v[i];
              filters[i].gain.value = v[i];
            }
          });
        }
      });

      document.querySelectorAll(".equalizer input").forEach(s => {
        s.addEventListener("input", e => {
          filters[e.target.dataset.band].gain.value = parseFloat(e.target.value);
        });
      });
