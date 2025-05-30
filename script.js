document.addEventListener("DOMContentLoaded", () => {
  const checkbox1 = document.getElementById("agree1");
  const checkbox2 = document.getElementById("agree2");
  const terms = document.getElementById("terms");
  const home = document.getElementById("home");

  const addButton = document.getElementById("add-entry");
  const imageInput = document.getElementById("image-input");
  const nameInput = document.getElementById("name-input");
  const messageInput = document.getElementById("message-input");
  const submitButton = document.getElementById("submit-entry");
  const documentDiv = document.getElementById("document");
  const communityPopup = document.getElementById("community-popup");
  const aboutPopup = document.getElementById("about-popup");
  const downloadButton = document.getElementById("download-button");
  const keywordBox = document.getElementById("keyword-box");

  communityPopup.style.display = "none";
  aboutPopup.style.display = "none";
  downloadButton.style.display = "none";

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  document.body.appendChild(tooltip);

  const nicknameSet = new Set();
  const nicknameList = document.createElement("ul");
  Object.assign(nicknameList.style, {
    padding: "10px",
    margin: "0",
    listStyle: "none",
    fontSize: "1.1rem",
  });
  document.getElementById("community-list-container").appendChild(nicknameList);

  let keywordIntervalStarted = false;
  let termsAgreed = false;
  let selectedInsertTarget = null;

  function checkBoth() {
    if (checkbox1.checked && checkbox2.checked) {
      terms.style.display = "none";
      home.style.display = "flex";
      downloadButton.style.display = "block";
      document.querySelector(".new-help-container").style.display = "block";
      termsAgreed = true;
    }
  }

  checkbox1.addEventListener("change", checkBoth);
  checkbox2.addEventListener("change", checkBoth);
  addButton.addEventListener("click", () => imageInput.click());

  const singleEntry = document.createElement("span");
  singleEntry.className = "entry";
  singleEntry.dataset.nickname = "shared";
  documentDiv.appendChild(singleEntry);

  submitButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const file = imageInput.files[0];

    if (!name) {
      nameInput.classList.add("shake");
      setTimeout(() => nameInput.classList.remove("shake"), 300);
      return;
    }

    if (!message && !file) return;

    const entryWrapper = document.createElement("span");
    entryWrapper.className = "entry";
    entryWrapper.dataset.nickname = name;

    const insertBtn = document.createElement("button");
    insertBtn.textContent = "+";
    insertBtn.className = "insert-button";

    insertBtn.addEventListener("click", () => {
      if (selectedInsertTarget) {
        selectedInsertTarget.classList.remove("insert-target");
      }
      selectedInsertTarget = entryWrapper;
      entryWrapper.classList.add("insert-target");
    });

    if (message) {
      const textSpan = document.createElement("span");
      textSpan.className = "entry-text";
      textSpan.textContent = message + " ";
      entryWrapper.appendChild(textSpan);
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement("img");
        img.src = reader.result;
        img.className = "inline-img";
        entryWrapper.appendChild(img);
        entryWrapper.appendChild(insertBtn);
      };
      reader.readAsDataURL(file);
    } else {
      entryWrapper.appendChild(insertBtn);
    }

    if (selectedInsertTarget && selectedInsertTarget.parentNode === singleEntry) {
      singleEntry.insertBefore(entryWrapper, selectedInsertTarget.nextSibling);
    } else {
      singleEntry.appendChild(entryWrapper);
    }

    selectedInsertTarget = null;

    if (!nicknameSet.has(name)) {
      nicknameSet.add(name);
      const li = document.createElement("li");
      li.textContent = name;
      nicknameList.appendChild(li);
    }

    nameInput.value = "";
    messageInput.value = "";
    imageInput.value = "";

    if (!keywordIntervalStarted) {
      keywordIntervalStarted = true;
      extractKeywords();
      setInterval(extractKeywords, 10000);
    }
  });

  // 한글 입력 조합 대응
  let isComposing = false;
  messageInput.addEventListener("compositionstart", () => (isComposing = true));
  messageInput.addEventListener("compositionend", () => (isComposing = false));
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      submitButton.click();
    }
  });

  // 툴팁 처리
  document.addEventListener("mouseover", (e) => {
    const realEntry = e.target.closest(".entry");
    tooltip.style.opacity = realEntry && realEntry.dataset.nickname !== "shared" ? "1" : "0";
    tooltip.textContent = realEntry?.dataset.nickname || "";
  });

  document.addEventListener("mousemove", (e) => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 20}px`;
  });

  document.addEventListener("mouseout", () => {
    tooltip.style.opacity = "0";
  });

  function extractKeywords() {
    const text = singleEntry.textContent;
    const words = text.match(/[\w가-힣]{2,}/g) || [];
    const stopwords = ['그리고', '하지만', '있다', '입니다', '있는', '하는', '그', '이', '저', '것', '에서'];
    const filtered = words.filter(w => !stopwords.includes(w));

    if (filtered.length === 0) {
      animateKeyword("");
      clearHighlights();
      return;
    }

    const shuffled = filtered.sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, 3);
    animateKeyword(sample.join(" "));
    highlightKeywords(sample);
  }

  function highlightKeywords(keywords) {
    clearHighlights();
    const walker = document.createTreeWalker(singleEntry, NodeFilter.SHOW_TEXT);
    const nodesToReplace = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentNode;
      if (parent.nodeName === "MARK") continue;

      let replaced = node.textContent;
      let matched = false;

      keywords.forEach(word => {
        const regex = new RegExp(`(${word})`, "g");
        if (regex.test(replaced)) {
          matched = true;
          replaced = replaced.replace(regex, `<mark class="keyword-highlight">$1</mark>`);
        }
      });

      if (matched) {
        const span = document.createElement("span");
        span.innerHTML = replaced;
        nodesToReplace.push({ oldNode: node, newNode: span });
      }
    }

    nodesToReplace.forEach(({ oldNode, newNode }) => {
      oldNode.parentNode.replaceChild(newNode, oldNode);
    });
  }

  function clearHighlights() {
    document.querySelectorAll(".keyword-highlight").forEach(el => {
      el.outerHTML = el.innerText;
    });
  }

  function animateKeyword(text) {
    keywordBox.innerHTML = "";
    if (!text.trim()) {
      keywordBox.textContent = " ";
      return;
    }

    const words = text.split(" ");
    words.forEach((word, i) => {
      [...word].forEach(char => {
        const span = document.createElement("span");
        span.className = "floating-char";
        span.textContent = char;
        span.style.animationDelay = `${Math.random()}s`;
        keywordBox.appendChild(span);
      });

      if (i < words.length - 1) {
        const spacer = document.createElement("span");
        spacer.innerHTML = "&nbsp;&nbsp;&nbsp;";
        keywordBox.appendChild(spacer);
      }
    });
  }

  document.addEventListener("click", (e) => {
    const targetImg = e.target.closest(".inline-img");
    if (!targetImg) return;

    const overlay = document.createElement("div");
    overlay.className = "image-overlay";

    const enlargedImg = document.createElement("img");
    enlargedImg.src = targetImg.src;
    Object.assign(enlargedImg.style, {
      maxWidth: "70vw",
      maxHeight: "70vh",
      boxShadow: "0 0 20px rgba(0,0,0,0.3)",
      pointerEvents: "none"
    });

    overlay.appendChild(enlargedImg);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () => overlay.remove());
  });

  downloadButton.addEventListener("click", () => {
    const element = document.getElementById("document");
    const opt = {
      margin: 0.5,
      filename: 'the_document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  });

  function setupPopup(triggerId, popupId, closeId, dragHandleId, posLeft, posTop) {
    const trigger = document.getElementById(triggerId);
    const popup = document.getElementById(popupId);
    const close = document.getElementById(closeId);
    const dragHandle = document.getElementById(dragHandleId);

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (!termsAgreed) return;

      if (popup.style.display !== "block") {
        popup.style.display = "block";
        popup.style.left = `${posLeft}px`;
        popup.style.top = `${posTop}px`;
      }
    });

    close.addEventListener("click", () => {
      popup.style.display = "none";
    });

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    dragHandle.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = popup.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      popup.style.zIndex = 1001;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        popup.style.left = `${e.clientX - offsetX}px`;
        popup.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  setupPopup("about-button", "about-popup", "close-about", "about-drag", 500, 100);
  setupPopup("community-button", "community-popup", "close-community", "community-drag", 880, 100);
});

// 메뉴 플로팅 효과 적용
function applyFloatingToMenu(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  const text = el.textContent.trim();
  el.innerHTML = "";

  [...text].forEach(char => {
    const span = document.createElement("span");
    span.className = "floating-char";
    span.textContent = char;
    span.style.display = "inline-block";
    span.style.animationDelay = `${Math.random()}s`;
    el.appendChild(span);
  });
}

applyFloatingToMenu("#about-button");
applyFloatingToMenu("#community-button");
applyFloatingToMenu("#download-button");
