// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
// File handling
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileList = document.getElementById('fileList');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const results = document.getElementById('results');
const uploadHint = document.getElementById('uploadHint');
const conversionOptions = document.querySelectorAll('.conversion-option');

let files = [];
let currentConversionType = 'md-csv';

// Conversion type configuration
const conversionConfig = {
    'md-csv': {
        accept: '.md,.markdown',
        hint: 'Supports: .md, .markdown files',
        convert: convertMarkdownToCSV
    },
    'md-pdf': {
        accept: '.md,.markdown',
        hint: 'Supports: .md, .markdown files',
        convert: convertMarkdownToPDF
    },
    'word-pdf': {
        accept: '.doc,.docx',
        hint: 'Supports: .doc, .docx files',
        convert: convertWordToPDF
    },
    'csv-json': {
        accept: '.csv',
        hint: 'Supports: .csv files',
        convert: convertCSVToJSON
    },
    'json-csv': {
        accept: '.json',
        hint: 'Supports: .json files',
        convert: convertJSONToCSV
    },
    'txt-pdf': {
        accept: '.txt',
        hint: 'Supports: .txt files',
        convert: convertTextToPDF
    }
};

// Conversion type selector
conversionOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Conversion type clicked:', option.dataset.type);
        conversionOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        currentConversionType = option.dataset.type;
        const config = conversionConfig[currentConversionType];
        if (config && fileInput && uploadHint) {
            fileInput.accept = config.accept;
            uploadHint.textContent = config.hint;
        }
        files = [];
        if (fileInput) fileInput.value = '';
        updateFileList();
        updateButtons();
        if (results) results.innerHTML = '';
    });
});

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
    const config = conversionConfig[currentConversionType];
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return config.accept.split(',').some(acceptExt => ext === acceptExt.trim());
    });
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

// ========== CONVERSION FUNCTIONS ==========

// Parse markdown table
function parseMarkdownTable(mdContent) {
    const lines = mdContent.split('\n');
    const rows = [];
    let inTable = false;

    for (let line of lines) {
        if (line.trim().startsWith('#')) continue;

        if (line.trim().startsWith('|')) {
            if (line.includes('---')) {
                inTable = true;
                continue;
            }

            if (inTable) {
                let cells = line.split('|').map(cell => cell.trim());
                if (cells.length > 0 && !cells[0]) cells = cells.slice(1);
                if (cells.length > 0 && !cells[cells.length - 1]) cells = cells.slice(0, -1);

                const cleanedCells = cells.map(cell => {
                    cell = cell.replace(/\*\*(.*?)\*\*/g, '$1');
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
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        }).join(',');
    }).join('\n');
}

// 1. Markdown to CSV
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
                    fileUrl: csvUrl,
                    fileBlob: csvBlob
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// 2. Markdown to PDF
async function convertMarkdownToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const mdContent = e.target.result;
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Simple markdown to text conversion (remove markdown syntax)
                let text = mdContent
                    .replace(/^#+\s+/gm, '') // Remove headers
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic
                    .replace(/`(.*?)`/g, '$1') // Remove code
                    .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links
                
                // Split into lines and add to PDF
                const lines = text.split('\n');
                let y = 20;
                const pageHeight = doc.internal.pageSize.height;
                const margin = 20;
                
                lines.forEach(line => {
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line.substring(0, 100), margin, y);
                    y += 7;
                });
                
                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                resolve({
                    fileName: file.name.replace(/\.(md|markdown)$/i, '.pdf'),
                    fileUrl: pdfUrl,
                    fileBlob: pdfBlob
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// 3. Word to PDF
async function convertWordToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                const html = result.value;
                
                // Convert HTML to plain text for PDF
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const text = tempDiv.textContent || tempDiv.innerText || '';
                
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const lines = text.split('\n');
                let y = 20;
                const pageHeight = doc.internal.pageSize.height;
                const margin = 20;
                
                lines.forEach(line => {
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line.substring(0, 100), margin, y);
                    y += 7;
                });
                
                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                resolve({
                    fileName: file.name.replace(/\.(doc|docx)$/i, '.pdf'),
                    fileUrl: pdfUrl,
                    fileBlob: pdfBlob
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

// 4. CSV to JSON
async function convertCSVToJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const lines = csvContent.split('\n').filter(line => line.trim());
                
                if (lines.length === 0) {
                    reject(new Error('CSV file is empty'));
                    return;
                }
                
                // Parse header
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                
                // Parse rows
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    data.push(obj);
                }
                
                const jsonContent = JSON.stringify(data, null, 2);
                const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
                const jsonUrl = URL.createObjectURL(jsonBlob);
                
                resolve({
                    fileName: file.name.replace(/\.csv$/i, '.json'),
                    fileUrl: jsonUrl,
                    fileBlob: jsonBlob
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// 5. JSON to CSV
async function convertJSONToCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const jsonContent = JSON.parse(e.target.result);
                const data = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
                
                if (data.length === 0) {
                    reject(new Error('JSON array is empty'));
                    return;
                }
                
                // Get headers
                const headers = Object.keys(data[0]);
                
                // Create CSV
                const csvRows = [headers.join(',')];
                
                data.forEach(obj => {
                    const values = headers.map(header => {
                        const value = obj[header] || '';
                        if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
                            return '"' + value.toString().replace(/"/g, '""') + '"';
                        }
                        return value.toString();
                    });
                    csvRows.push(values.join(','));
                });
                
                const csvContent = csvRows.join('\n');
                const csvBlob = new Blob([csvContent], { type: 'text/csv' });
                const csvUrl = URL.createObjectURL(csvBlob);
                
                resolve({
                    fileName: file.name.replace(/\.json$/i, '.csv'),
                    fileUrl: csvUrl,
                    fileBlob: csvBlob
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// 6. Text to PDF
async function convertTextToPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const lines = text.split('\n');
                let y = 20;
                const pageHeight = doc.internal.pageSize.height;
                const margin = 20;
                const maxWidth = doc.internal.pageSize.width - (margin * 2);
                
                lines.forEach(line => {
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = 20;
                    }
                    const splitLines = doc.splitTextToSize(line, maxWidth);
                    splitLines.forEach(splitLine => {
                        if (y > pageHeight - margin) {
                            doc.addPage();
                            y = 20;
                        }
                        doc.text(splitLine, margin, y);
                        y += 7;
                    });
                });
                
                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                resolve({
                    fileName: file.name.replace(/\.txt$/i, '.pdf'),
                    fileUrl: pdfUrl,
                    fileBlob: pdfBlob
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

    const config = conversionConfig[currentConversionType];
    convertBtn.disabled = true;
    convertBtn.querySelector('.btn-text').textContent = 'Converting...';
    convertBtn.querySelector('.btn-loader').style.display = 'block';
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

        statusSpan.textContent = 'Converting...';
        statusSpan.className = 'file-status converting';

        try {
            const result = await config.convert(file);
            
            const downloadItem = document.createElement('div');
            downloadItem.className = 'download-item';
            downloadItem.innerHTML = `
                <span>${result.fileName}</span>
                <a href="${result.fileUrl}" download="${result.fileName}" class="download-link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            statusSpan.className = 'file-status error';
            failCount++;
            console.error('Conversion error:', error);
        }
    }

    if (successCount > 0) {
        results.appendChild(downloadSection);
    }

    if (failCount > 0) {
        const errorMsg = document.createElement('div');
        errorMsg.style.marginTop = '15px';
        errorMsg.style.padding = '15px';
        errorMsg.style.background = '#f8d7da';
        errorMsg.style.color = '#721c24';
        errorMsg.style.borderRadius = '10px';
        errorMsg.style.border = '1px solid #f5c2c7';
        errorMsg.textContent = `${failCount} file(s) failed to convert. Please check the file format.`;
        results.appendChild(errorMsg);
    }

    convertBtn.disabled = false;
    convertBtn.querySelector('.btn-text').textContent = 'Convert Files';
    convertBtn.querySelector('.btn-loader').style.display = 'none';
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
const initialConfig = conversionConfig[currentConversionType];
if (fileInput && uploadHint && initialConfig) {
    fileInput.accept = initialConfig.accept;
    uploadHint.textContent = initialConfig.hint;
}
updateFileList();
updateButtons();
} // End of initializeApp function
