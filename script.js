// File handling
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileList = document.getElementById('fileList');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const results = document.getElementById('results');

let files = [];

// Upload area click
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.name.endsWith('.md') || file.name.endsWith('.markdown')
    );
    handleFiles(droppedFiles);
});

// Handle file selection
function handleFiles(newFiles) {
    files = [...files, ...newFiles];
    updateFileList();
    updateButtons();
}

// Update file list display
function updateFileList() {
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<div class="empty-state">No files selected</div>';
        return;
    }

    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <svg class="file-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            </div>
            <span class="file-status pending">Pending</span>
        `;
        fileList.appendChild(fileItem);
    });
}

// Update button states
function updateButtons() {
    convertBtn.disabled = files.length === 0;
    clearBtn.disabled = files.length === 0;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Parse markdown table
function parseMarkdownTable(mdContent) {
    const lines = mdContent.split('\n');
    const rows = [];
    let inTable = false;

    for (let line of lines) {
        // Skip header lines (starting with #)
        if (line.trim().startsWith('#')) {
            continue;
        }

        // Check if this is a table row (starts with |)
        if (line.trim().startsWith('|')) {
            // Skip separator rows (contains only ---)
            if (line.includes('---')) {
                inTable = true;
                continue;
            }

            if (inTable) {
                // Split by | and clean up
                let cells = line.split('|').map(cell => cell.trim());
                // Remove empty first and last elements (from leading/trailing |)
                if (cells.length > 0 && !cells[0]) {
                    cells = cells.slice(1);
                }
                if (cells.length > 0 && !cells[cells.length - 1]) {
                    cells = cells.slice(0, -1);
                }

                // Remove markdown formatting
                const cleanedCells = cells.map(cell => {
                    // Remove ** for bold
                    cell = cell.replace(/\*\*(.*?)\*\*/g, '$1');
                    // Remove HTML tags
                    cell = cell.replace(/<.*?>/g, '');
                    return cell;
                });

                if (cleanedCells.length > 0) {
                    rows.push(cleanedCells);
                }
            }
        }
    }

    return rows;
}

// Convert array to CSV string
function arrayToCSV(rows) {
    return rows.map(row => {
        return row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        }).join(',');
    }).join('\n');
}

// Convert markdown to CSV
async function convertMarkdownToCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const mdContent = e.target.result;
                const rows = parseMarkdownTable(mdContent);
                
                if (rows.length === 0) {
                    reject(new Error('No table data found'));
                    return;
                }

                const csvContent = arrayToCSV(rows);
                const csvBlob = new Blob([csvContent], { type: 'text/csv' });
                const csvUrl = URL.createObjectURL(csvBlob);
                
                resolve({
                    fileName: file.name.replace(/\.(md|markdown)$/i, '.csv'),
                    csvUrl: csvUrl,
                    csvContent: csvContent
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Convert all files
convertBtn.addEventListener('click', async () => {
    if (files.length === 0) return;

    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    results.innerHTML = '';

    const downloadSection = document.createElement('div');
    downloadSection.className = 'download-section';
    downloadSection.innerHTML = '<h3>✅ Conversion Complete!</h3>';

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = fileList.children[i];
        const statusSpan = fileItem.querySelector('.file-status');

        try {
            const result = await convertMarkdownToCSV(file);
            
            const downloadItem = document.createElement('div');
            downloadItem.className = 'download-item';
            downloadItem.innerHTML = `
                <span>${result.fileName}</span>
                <a href="${result.csvUrl}" download="${result.fileName}" class="download-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
                </a>
            `;
            downloadSection.appendChild(downloadItem);

            statusSpan.textContent = 'Converted';
            statusSpan.className = 'file-status converted';
            successCount++;
        } catch (error) {
            statusSpan.textContent = 'Error';
            statusSpan.className = 'file-status';
            statusSpan.style.background = '#f8d7da';
            statusSpan.style.color = '#721c24';
            failCount++;
        }
    }

    if (successCount > 0) {
        results.appendChild(downloadSection);
    }

    if (failCount > 0) {
        const errorMsg = document.createElement('div');
        errorMsg.style.marginTop = '15px';
        errorMsg.style.padding = '10px';
        errorMsg.style.background = '#f8d7da';
        errorMsg.style.color = '#721c24';
        errorMsg.style.borderRadius = '5px';
        errorMsg.textContent = `${failCount} file(s) failed to convert.`;
        results.appendChild(errorMsg);
    }

    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert All to CSV';
});

// Clear files
clearBtn.addEventListener('click', () => {
    files = [];
    fileInput.value = '';
    updateFileList();
    updateButtons();
    results.innerHTML = '';
});

// Initialize
updateFileList();
updateButtons();

