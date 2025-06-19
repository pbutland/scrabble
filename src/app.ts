// Scrabble tile visualizer application
import { convertToTiles } from './tile-utils';

// Function to modify SVG content to make it responsive and theme-aware
function makeSvgResponsive(svgContent: string): string {
    return svgContent
        .replace(/<rect([^>]*)fill="white"/, '<rect$1fill="var(--bg-color)"')
        .replace(/<text([^>]*?)>([^<]*)<\/text>/g, '<text$1 fill="var(--text-color)">$2</text>')
        .replace(/<svg([^>]*)/, '<svg$1 class="tile-svg-content"')
        .replace(/stroke="black"/g, 'stroke="var(--text-color)"');
}

// Function to create a downloadable SVG from a permutation row
function downloadPermutationAsSVG(permutationRow: HTMLElement, word: string): void {
    // Get all word containers in the permutation row
    const wordContainers = permutationRow.querySelectorAll('.tile-word');
    if (!wordContainers.length) return;
    
    // Get all SVG elements for validation
    const allSvgElements = permutationRow.querySelectorAll('.tile-svg-content');
    if (!allSvgElements.length) return;
    
    // Helper function to get original SVG dimensions
    const getOriginalSvgDimensions = (svgElement: SVGSVGElement): { width: number, height: number } => {
        // Parse the SVG content
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const originalSvg = svgDoc.documentElement;
        
        // Try to get width and height from attributes first
        let width = parseFloat(originalSvg.getAttribute('width') || '0');
        let height = parseFloat(originalSvg.getAttribute('height') || '0');
        
        // If not available, try to get from viewBox
        if (width === 0 || height === 0) {
            const viewBox = originalSvg.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/\s+|,/).map(parseFloat);
                if (parts.length === 4) {
                    width = parts[2];
                    height = parts[3];
                }
            }
        }
        
        // Use fallback values if still not available
        if (width === 0) width = 100;
        if (height === 0) height = 100;
        
        return { width, height };
    };
    
    // Calculate dimensions based on the SVG elements
    let totalWidth = 0;
    let maxHeight = 0;
    let wordCount = 0;
    
    // First pass to calculate max height across all elements
    allSvgElements.forEach((svg: Element) => {
        const svgElement = svg as SVGSVGElement;
        const { height } = getOriginalSvgDimensions(svgElement);
        maxHeight = Math.max(maxHeight, height);
    });
    
    // Calculate total width, considering word grouping
    wordContainers.forEach((wordContainer) => {
        const wordSvgElements = wordContainer.querySelectorAll('.tile-svg-content');
        if (wordSvgElements.length > 0) {
            wordCount++;
            let wordWidth = 0;
            
            // Calculate width for this word
            wordSvgElements.forEach((svg: Element) => {
                const svgElement = svg as SVGSVGElement;
                const { width } = getOriginalSvgDimensions(svgElement);
                wordWidth += width;
            });
            
            // Add spacing between elements within the word
            wordWidth += (wordSvgElements.length - 1) * 10;
            
            totalWidth += wordWidth;
        }
    });
    
    // Add some padding
    totalWidth += 20;  // 10px padding on each side
    
    // Add extra spacing between words (20px between words)
    if (wordCount > 1) {
        totalWidth += (wordCount - 1) * 20;
    }
    
    // Account for the extra spacing that's added after the last element of each word
    // When positioning elements, we add extra 10px spacing after every element including the last one
    // but that space isn't needed for the last element in each word
    totalWidth += (wordCount - 1) * 10;
    
    maxHeight += 20;   // 10px padding on top and bottom
    
    // Start creating the combined SVG
    const combinedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    combinedSvg.setAttribute('width', totalWidth.toString());
    combinedSvg.setAttribute('height', maxHeight.toString());
    combinedSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${maxHeight}`);
    combinedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Group to hold all the elements
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Current X position for placing elements
    let currentX = 10;  // Start with 10px padding
    
    // Process each word container and its SVG elements
    wordContainers.forEach((wordContainer) => {
        const wordSvgElements = wordContainer.querySelectorAll('.tile-svg-content');
        if (wordSvgElements.length === 0) return;
        
        // Create a group for this word
        const wordGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.appendChild(wordGroup);
        
        // Starting X position for elements within this word
        const wordStartX = currentX;
        let wordCurrentX = 0;
        
        // Process each SVG element in this word
        wordSvgElements.forEach((svg: Element) => {
            const svgElement = svg as SVGSVGElement;
            const { width, height } = getOriginalSvgDimensions(svgElement);
        
            // Get the original SVG's XML content
            const svgString = new XMLSerializer().serializeToString(svgElement);
            
            // Parse the original SVG content as a document
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            const originalSvg = svgDoc.documentElement;
            
            // Extract content from original SVG directly
            // Most element SVGs have their content in a g tag
            let contentElement = originalSvg.querySelector('g');
            
            // Element position within the word group
            const elementX = wordStartX + wordCurrentX;
            
            if (contentElement) {
                // Clone the content element
                const clonedContent = contentElement.cloneNode(true) as Element;
                
                // Apply necessary transformations to position the element
                const currentTransform = clonedContent.getAttribute('transform') || '';
                clonedContent.setAttribute('transform', 
                    `translate(${elementX}, ${(maxHeight - height) / 2}) ${currentTransform}`);
                
                // Add to the word group
                wordGroup.appendChild(clonedContent);
            } else {
                // If no g tag found, create a group for this element
                const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                newGroup.setAttribute('transform', `translate(${elementX}, ${(maxHeight - height) / 2})`);
                
                // Copy all child nodes except the svg tag itself
                Array.from(originalSvg.childNodes).forEach(child => {
                    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName.toLowerCase() !== 'svg') {
                        const importedNode = document.importNode(child, true);
                        newGroup.appendChild(importedNode);
                    }
                });
                
                // Add to the word group
                wordGroup.appendChild(newGroup);
            }
            
            wordCurrentX += width + 10;  // Add spacing between elements within the word
        });
        
        // Move to the next word's starting position (with extra spacing between words)
        currentX += wordCurrentX + 20;  // Add extra space (20px) between words
    });
    
    combinedSvg.appendChild(group);
    
    // Convert SVG to a data URI
    const svgData = new XMLSerializer().serializeToString(combinedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${word.replace(/\s+/g, '-')}-tiles.svg`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the URL object
    setTimeout(() => {
        URL.revokeObjectURL(svgUrl);
    }, 100);
}

// Function to create a shareable URL and copy to clipboard
function shareUrl(word: string): void {
    // Create URL with the current word as a parameter
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ word }).toString();
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString())
        .then(() => {
            // Show toast notification
            const toast = document.getElementById('toast');
            if (toast) {
                toast.classList.add('show');
                
                // Hide toast after 3 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            }
        })
        .catch(err => {
            console.error('Failed to copy URL: ', err);
            alert('Failed to copy the share link to clipboard.');
        });
}

// Theme management
function setTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Function to get URL query parameters
function getQueryParam(param: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to process word input
function processWordInput(word: string, elementContainer: HTMLElement, resultDiv: HTMLElement): void {
    // Clear previous results
    elementContainer.innerHTML = '';
    resultDiv.textContent = '';
    
    // Get share button
    const shareButton = document.getElementById('share-button') as HTMLButtonElement;
    
    // Disable the share button by default
    if (shareButton) {
        shareButton.disabled = true;
    }
    
    if (!word) {
        return;
    }
    
    // Check if the word/phrase can be visualized with Scrabble tiles
    const tilePermutations = convertToTiles(word);
    
    if (tilePermutations && tilePermutations.length > 0) {
        // Word/phrase can be visualized with Scrabble tiles
        resultDiv.textContent = ``;
        
        // Enable the share button
        if (shareButton) {
            shareButton.disabled = false;
        }
        
        // Create a map to cache SVGs so we don't reload them for each permutation
        const svgCache: Record<string, string> = {};
        
        // Process each permutation
        tilePermutations.forEach((tilePath, permutationIndex) => {
            // Create a container for this permutation
            const permutationRow = document.createElement('div');
            permutationRow.className = 'permutation-row';
            
            elementContainer.appendChild(permutationRow);
            
            // Define the result type to handle different cases
            type ElementResult = 
                | { element: string; isSpace: true; }
                | { element: string; svgContent: string; }
                | { element: string; error: true; };
                
            // Array to store promises for this permutation's SVG loads
            const loadPromises = tilePath.map(letter => {
                // Skip processing for space markers - will be handled later
                if (letter === '_SPACE_') {
                    return Promise.resolve({
                        element: '_SPACE_',
                        isSpace: true as const
                    });
                }
                
                // Use cached SVG if available
                if (svgCache[letter]) {
                    return Promise.resolve({
                        element: letter,
                        svgContent: svgCache[letter]
                    });
                }
                
                // Fetch the SVG from the tiles directory
                return fetch(`./tiles/${letter}.svg`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`SVG for ${letter} not found`);
                        }
                        return response.text();
                    })
                    .then(svgContent => {
                        // Cache the SVG
                        svgCache[letter] = svgContent;
                        return {
                            element: letter,
                            svgContent
                        };
                    })
                    .catch(error => {
                        console.error(error);
                        return {
                            element: letter,
                            error: true as const
                        };
                    });
            });
            
            // When all SVGs for this permutation are loaded, add them to the container in the correct order
            Promise.all(loadPromises)
                .then((results: ElementResult[]) => {
                    // Group elements into words
                    let currentWord = document.createElement('div');
                    currentWord.className = 'tile-word';
                    permutationRow.appendChild(currentWord);
                    
                    results.forEach(result => {
                        // Handle space marker - create a new word container
                        if ('isSpace' in result && result.isSpace) {
                            currentWord = document.createElement('div');
                            currentWord.className = 'tile-word';
                            permutationRow.appendChild(currentWord);
                            return;
                        }
                        
                        const elementDiv = document.createElement('div');
                        elementDiv.className = 'tile-svg';
                        
                        if ('error' in result && result.error) {
                            elementDiv.textContent = `Error loading ${result.element}`;
                        } else if ('svgContent' in result) {
                            // Make SVG responsive
                            elementDiv.innerHTML = makeSvgResponsive(result.svgContent);
                        }
                        
                        // Add the element to the current word container
                        currentWord.appendChild(elementDiv);
                    });
                    
                    // Add download button for this permutation
                    const downloadButton = document.createElement('button');
                    downloadButton.className = 'download-svg-button';
                    downloadButton.title = 'Download SVG';
                    downloadButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                    `;
                    permutationRow.appendChild(downloadButton);
                    
                    // Set up download button click handler
                    downloadButton.addEventListener('click', () => {
                        downloadPermutationAsSVG(permutationRow, word);
                    });
                });
        });
    } else {
        // Word/phrase contains invalid characters
        resultDiv.textContent = `"${word}" contains invalid characters. Only letters A-Z and spaces are allowed.`;
        
        // Keep share button disabled since the input is invalid
        if (shareButton) {
            shareButton.disabled = true;
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('word-form') as HTMLFormElement;
    const wordInput = document.getElementById('word-input') as HTMLInputElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;
    const elementContainer = document.getElementById('tile-container') as HTMLDivElement;
    const themeRadios = document.querySelectorAll('input[name="theme"]') as NodeListOf<HTMLInputElement>;
    const shareButton = document.getElementById('share-button') as HTMLButtonElement;
    
    // Check for query parameter 'word'
    const wordFromParam = getQueryParam('word');
    
    // Set up theme toggle event listeners
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            setTheme(target.value as 'light' | 'dark');
        });
    });
    
    // Set up share button click handler
    shareButton.addEventListener('click', () => {
        // Only proceed if button is not disabled
        if (!shareButton.disabled) {
            const inputText = wordInput.value.trim();
            if (inputText) {
                shareUrl(inputText);
            }
        }
    });
    
    // Prevent default form submission but still keep the form for accessibility
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
    
    // Process input as user types
    wordInput.addEventListener('input', () => {
        const inputText = wordInput.value.trim();
        processWordInput(inputText, elementContainer, resultDiv);
    });
    
    // If there's a word parameter in the URL, use it to auto-populate input field
    if (wordFromParam) {
        wordInput.value = wordFromParam;
        processWordInput(wordFromParam, elementContainer, resultDiv);
    } else {
        // Ensure share button is disabled initially
        shareButton.disabled = true;
    }
});
