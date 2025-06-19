// src/tile-utils.ts
function convertToTiles(wordOrPhrase) {
  if (!/^[a-zA-Z\s]*$/.test(wordOrPhrase)) {
    return false;
  }
  const result = [];
  for (const char of wordOrPhrase) {
    if (char === " ") {
      if (result.length > 0 && result[result.length - 1] !== "_SPACE_") {
        result.push("_SPACE_");
      }
    } else {
      result.push(char.toUpperCase());
    }
  }
  if (result.length === 0) return false;
  return [result];
}

// src/app.ts
function makeSvgResponsive(svgContent) {
  return svgContent.replace(/<rect([^>]*)fill="white"/, '<rect$1fill="var(--bg-color)"').replace(/<text([^>]*?)>([^<]*)<\/text>/g, '<text$1 fill="var(--text-color)">$2</text>').replace(/<svg([^>]*)/, '<svg$1 class="tile-svg-content"').replace(/stroke="black"/g, 'stroke="var(--text-color)"');
}
function downloadPermutationAsSVG(permutationRow, word) {
  const wordContainers = permutationRow.querySelectorAll(".tile-word");
  if (!wordContainers.length) return;
  const allSvgElements = permutationRow.querySelectorAll(".tile-svg-content");
  if (!allSvgElements.length) return;
  const getOriginalSvgDimensions = (svgElement) => {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const originalSvg = svgDoc.documentElement;
    let width = parseFloat(originalSvg.getAttribute("width") || "0");
    let height = parseFloat(originalSvg.getAttribute("height") || "0");
    if (width === 0 || height === 0) {
      const viewBox = originalSvg.getAttribute("viewBox");
      if (viewBox) {
        const parts = viewBox.split(/\s+|,/).map(parseFloat);
        if (parts.length === 4) {
          width = parts[2];
          height = parts[3];
        }
      }
    }
    if (width === 0) width = 100;
    if (height === 0) height = 100;
    return { width, height };
  };
  let totalWidth = 0;
  let maxHeight = 0;
  let wordCount = 0;
  allSvgElements.forEach((svg) => {
    const svgElement = svg;
    const { height } = getOriginalSvgDimensions(svgElement);
    maxHeight = Math.max(maxHeight, height);
  });
  wordContainers.forEach((wordContainer) => {
    const wordSvgElements = wordContainer.querySelectorAll(".tile-svg-content");
    if (wordSvgElements.length > 0) {
      wordCount++;
      let wordWidth = 0;
      wordSvgElements.forEach((svg) => {
        const svgElement = svg;
        const { width } = getOriginalSvgDimensions(svgElement);
        wordWidth += width;
      });
      wordWidth += (wordSvgElements.length - 1) * 10;
      totalWidth += wordWidth;
    }
  });
  totalWidth += 20;
  if (wordCount > 1) {
    totalWidth += (wordCount - 1) * 20;
  }
  totalWidth += (wordCount - 1) * 10;
  maxHeight += 20;
  const combinedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  combinedSvg.setAttribute("width", totalWidth.toString());
  combinedSvg.setAttribute("height", maxHeight.toString());
  combinedSvg.setAttribute("viewBox", `0 0 ${totalWidth} ${maxHeight}`);
  combinedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  let currentX = 10;
  wordContainers.forEach((wordContainer) => {
    const wordSvgElements = wordContainer.querySelectorAll(".tile-svg-content");
    if (wordSvgElements.length === 0) return;
    const wordGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(wordGroup);
    const wordStartX = currentX;
    let wordCurrentX = 0;
    wordSvgElements.forEach((svg) => {
      const svgElement = svg;
      const { width, height } = getOriginalSvgDimensions(svgElement);
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const originalSvg = svgDoc.documentElement;
      let contentElement = originalSvg.querySelector("g");
      const elementX = wordStartX + wordCurrentX;
      if (contentElement) {
        const clonedContent = contentElement.cloneNode(true);
        const currentTransform = clonedContent.getAttribute("transform") || "";
        clonedContent.setAttribute(
          "transform",
          `translate(${elementX}, ${(maxHeight - height) / 2}) ${currentTransform}`
        );
        wordGroup.appendChild(clonedContent);
      } else {
        const newGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        newGroup.setAttribute("transform", `translate(${elementX}, ${(maxHeight - height) / 2})`);
        Array.from(originalSvg.childNodes).forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== "svg") {
            const importedNode = document.importNode(child, true);
            newGroup.appendChild(importedNode);
          }
        });
        wordGroup.appendChild(newGroup);
      }
      wordCurrentX += width + 10;
    });
    currentX += wordCurrentX + 20;
  });
  combinedSvg.appendChild(group);
  const svgData = new XMLSerializer().serializeToString(combinedSvg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = `${word.replace(/\s+/g, "-")}-tiles.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => {
    URL.revokeObjectURL(svgUrl);
  }, 100);
}
function shareUrl(word) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ word }).toString();
  navigator.clipboard.writeText(url.toString()).then(() => {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3e3);
    }
  }).catch((err) => {
    console.error("Failed to copy URL: ", err);
    alert("Failed to copy the share link to clipboard.");
  });
}
function setTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
function processWordInput(word, elementContainer, resultDiv) {
  elementContainer.innerHTML = "";
  resultDiv.textContent = "";
  const shareButton = document.getElementById("share-button");
  if (shareButton) {
    shareButton.disabled = true;
  }
  if (!word) {
    return;
  }
  const tilePermutations = convertToTiles(word);
  if (tilePermutations && tilePermutations.length > 0) {
    resultDiv.textContent = ``;
    if (shareButton) {
      shareButton.disabled = false;
    }
    const svgCache = {};
    tilePermutations.forEach((tilePath, permutationIndex) => {
      const permutationRow = document.createElement("div");
      permutationRow.className = "permutation-row";
      elementContainer.appendChild(permutationRow);
      const loadPromises = tilePath.map((letter) => {
        if (letter === "_SPACE_") {
          return Promise.resolve({
            element: "_SPACE_",
            isSpace: true
          });
        }
        if (svgCache[letter]) {
          return Promise.resolve({
            element: letter,
            svgContent: svgCache[letter]
          });
        }
        return fetch(`./tiles/${letter}.svg`).then((response) => {
          if (!response.ok) {
            throw new Error(`SVG for ${letter} not found`);
          }
          return response.text();
        }).then((svgContent) => {
          svgCache[letter] = svgContent;
          return {
            element: letter,
            svgContent
          };
        }).catch((error) => {
          console.error(error);
          return {
            element: letter,
            error: true
          };
        });
      });
      Promise.all(loadPromises).then((results) => {
        let currentWord = document.createElement("div");
        currentWord.className = "tile-word";
        permutationRow.appendChild(currentWord);
        results.forEach((result) => {
          if ("isSpace" in result && result.isSpace) {
            currentWord = document.createElement("div");
            currentWord.className = "tile-word";
            permutationRow.appendChild(currentWord);
            return;
          }
          const elementDiv = document.createElement("div");
          elementDiv.className = "tile-svg";
          if ("error" in result && result.error) {
            elementDiv.textContent = `Error loading ${result.element}`;
          } else if ("svgContent" in result) {
            elementDiv.innerHTML = makeSvgResponsive(result.svgContent);
          }
          currentWord.appendChild(elementDiv);
        });
        const downloadButton = document.createElement("button");
        downloadButton.className = "download-svg-button";
        downloadButton.title = "Download SVG";
        downloadButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                    `;
        permutationRow.appendChild(downloadButton);
        downloadButton.addEventListener("click", () => {
          downloadPermutationAsSVG(permutationRow, word);
        });
      });
    });
  } else {
    resultDiv.textContent = `"${word}" contains invalid characters. Only letters A-Z and spaces are allowed.`;
    if (shareButton) {
      shareButton.disabled = true;
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("word-form");
  const wordInput = document.getElementById("word-input");
  const resultDiv = document.getElementById("result");
  const elementContainer = document.getElementById("tile-container");
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const shareButton = document.getElementById("share-button");
  const wordFromParam = getQueryParam("word");
  themeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const target = e.target;
      setTheme(target.value);
    });
  });
  shareButton.addEventListener("click", () => {
    if (!shareButton.disabled) {
      const inputText = wordInput.value.trim();
      if (inputText) {
        shareUrl(inputText);
      }
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });
  wordInput.addEventListener("input", () => {
    const inputText = wordInput.value.trim();
    processWordInput(inputText, elementContainer, resultDiv);
  });
  if (wordFromParam) {
    wordInput.value = wordFromParam;
    processWordInput(wordFromParam, elementContainer, resultDiv);
  } else {
    shareButton.disabled = true;
  }
});
//# sourceMappingURL=app.js.map
