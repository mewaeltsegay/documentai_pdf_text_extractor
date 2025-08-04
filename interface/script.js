// Global variables
let datasetData = null;
let filteredData = null;
let currentView = 'dashboard';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupEventListeners();
    loadData();
}

// Navigation setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Event listeners setup
function setupEventListeners() {
    // Refresh data button
    document.getElementById('refresh-data').addEventListener('click', loadData);
    
    // Export data button
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // Search inputs
    const docSearch = document.getElementById('doc-search');
    if (docSearch) docSearch.addEventListener('input', filterDocuments);
    
    const blockSearch = document.getElementById('block-search');
    if (blockSearch) blockSearch.addEventListener('input', filterBlocks);
    
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) globalSearch.addEventListener('input', globalSearch);
    
    // Filter controls
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.addEventListener('change', filterDocuments);
    
    const sortBy = document.getElementById('sort-by');
    if (sortBy) sortBy.addEventListener('change', sortDocuments);
    
    const blockTypeFilter = document.getElementById('block-type-filter');
    if (blockTypeFilter) blockTypeFilter.addEventListener('change', filterBlocks);
    
    // Search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.addEventListener('click', performGlobalSearch);
    
    // Modal close
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('document-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // PDF Viewer event listeners
    setupPDFViewerEventListeners();
}

// Switch between views
function switchView(view) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected view
    const viewElement = document.getElementById(`${view}-view`);
    if (viewElement) {
        viewElement.style.display = 'block';
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'documents': 'Documents',
        'blocks': 'Text Blocks',
        'tables': 'Tables',
        'pages': 'Pages',
        'pdf-viewer': 'PDF Viewer',
        'search': 'Search'
    };
    
    document.getElementById('page-title').textContent = titles[view] || 'Dashboard';
    currentView = view;
    
    // Load view-specific data
    switch(view) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'documents':
            renderDocuments();
            break;
        case 'blocks':
            renderBlocks();
            break;
        case 'tables':
            renderTables();
            break;
        case 'pages':
            renderPages();
            break;
        case 'pdf-viewer':
            renderPDFViewer();
            break;
        case 'search':
            renderSearch();
            break;
    }
}

// Load dataset
async function loadData() {
    showLoading(true);
    
    try {
        let response;
        let dataSource = '';
        
        // Try different paths for the main dataset
        // Server now serves from parent directory, so paths are adjusted
        const datasetPaths = [
            '/interface/layout_dataset.json',  // If copied to interface directory
            '/output/layout_dataset.json',     // Standard location from server root
            './layout_dataset.json',           // Local copy (relative to interface)
            '../output/layout_dataset.json',   // Legacy relative path
            './output/layout_dataset.json',    // Alternative relative
            'output/layout_dataset.json'       // Relative without ../
        ];
        
        console.log('🔍 Searching for dataset files...');
        
        let foundDataset = false;
        for (const path of datasetPaths) {
            try {
                console.log(`Trying: ${path}`);
                response = await fetch(path);
                if (response.ok) {
                    console.log(`✅ Found dataset at: ${path}`);
                    dataSource = `Main dataset (${path})`;
                    foundDataset = true;
                    break;
                }
            } catch (error) {
                console.log(`❌ Failed: ${path} - ${error.message}`);
            }
        }
        
        // Only fall back to demo data if explicitly no main dataset found
        if (!foundDataset) {
            console.log('⚠️ Main dataset not found, trying demo data...');
            const demoPaths = [
                '/interface/demo-data.json',    // Demo data from server root
                './demo-data.json',             // Demo data relative to interface
                'demo-data.json'                // Demo data without ./
            ];
            
            for (const demoPath of demoPaths) {
                try {
                    console.log(`Trying demo data: ${demoPath}`);
                    response = await fetch(demoPath);
                    if (response.ok) {
                        console.log(`📋 Using demo data from: ${demoPath}`);
                        dataSource = `Demo data (${demoPath})`;
                        foundDataset = true;
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Demo data failed: ${demoPath} - ${error.message}`);
                }
            }
        }
        
        if (!foundDataset) {
            throw new Error('No dataset files found. Please run the parser first or check file paths.');
        }
        
        console.log(`📊 Loading data from: ${dataSource}`);
        datasetData = await response.json();
        filteredData = [...datasetData];
        
        // Update sidebar status with data source info
        updateSidebarStatus(dataSource);
        
        // Refresh current view
        switchView(currentView);
        
        showLoading(false);
        console.log(`✅ Successfully loaded ${datasetData.length} documents`);
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError(`Unable to load dataset: ${error.message}\n\nPlease check:\n1. Run 'python parser.py' to generate data\n2. Ensure you're using a web server (python launch.py)\n3. Check browser console for detailed errors`);
        showLoading(false);
    }
}

// Show/hide loading state
function showLoading(show) {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    if (show) {
        loading.style.display = 'flex';
        error.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

// Show error state
function showError(message) {
    const error = document.getElementById('error');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    error.style.display = 'flex';
}

// Update sidebar status
function updateSidebarStatus(dataSource = '') {
    if (!datasetData) return;
    
    const totalDocs = datasetData.length;
    const successfulDocs = datasetData.filter(doc => doc.status === 'success');
    const totalPages = successfulDocs.reduce((sum, doc) => 
        sum + (doc.document_info?.total_pages || 0), 0);
    
    const lastProcessed = datasetData.reduce((latest, doc) => {
        const docDate = new Date(doc.processing_timestamp || 0);
        return docDate > latest ? docDate : latest;
    }, new Date(0));
    
    document.getElementById('total-docs').textContent = totalDocs;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('last-updated').textContent = 
        lastProcessed.toLocaleDateString() + ' ' + lastProcessed.toLocaleTimeString();
        
    // Add data source indicator if available
    if (dataSource) {
        const existingSource = document.querySelector('.data-source-indicator');
        if (existingSource) existingSource.remove();
        
        const sourceElement = document.createElement('div');
        sourceElement.className = 'data-source-indicator';
        sourceElement.innerHTML = `
            <div class="status-item">
                <span class="status-label">Data Source:</span>
                <span class="status-value">${dataSource}</span>
            </div>
        `;
        
        const dataStatus = document.querySelector('.data-status');
        if (dataStatus) dataStatus.appendChild(sourceElement);
    }
}

// Render dashboard
function renderDashboard() {
    if (!datasetData) return;
    
    const successfulDocs = datasetData.filter(doc => doc.status === 'success');
    const totalPages = successfulDocs.reduce((sum, doc) => 
        sum + (doc.document_info?.total_pages || 0), 0);
    const totalBlocks = successfulDocs.reduce((sum, doc) => 
        sum + (doc.blocks?.length || 0), 0);
    const totalTables = successfulDocs.reduce((sum, doc) => 
        sum + (doc.tables?.length || 0), 0);
    
    // Update stats
    document.getElementById('stat-documents').textContent = datasetData.length;
    document.getElementById('stat-pages').textContent = totalPages;
    document.getElementById('stat-blocks').textContent = totalBlocks;
    document.getElementById('stat-tables').textContent = totalTables;
    
    // Charts removed due to rendering issues
    
    // Render recent documents
    renderRecentDocuments();
}

// Chart code removed due to rendering issues

// Render recent documents
function renderRecentDocuments() {
    const container = document.getElementById('recent-docs-list');
    if (!container || !datasetData) return;
    
    const recentDocs = [...datasetData]
        .sort((a, b) => new Date(b.processing_timestamp || 0) - new Date(a.processing_timestamp || 0))
        .slice(0, 5);
    
    container.innerHTML = recentDocs.map(doc => `
        <div class="document-card" onclick="showDocumentDetails('${doc.file_name}')">
            <div class="document-header">
                <div class="document-title">${doc.file_name}</div>
                <div class="document-status status-${doc.status}">${doc.status}</div>
            </div>
            <div class="document-meta">
                Processed: ${new Date(doc.processing_timestamp || 0).toLocaleString()}
            </div>
            <div class="document-stats">
                <div class="stat-item">
                    <span class="stat-label">Pages:</span>
                    <span class="stat-value">${doc.document_info?.total_pages || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Blocks:</span>
                    <span class="stat-value">${doc.blocks?.length || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Render documents view
function renderDocuments() {
    if (!datasetData) return;
    
    const container = document.getElementById('documents-grid');
    const docs = filteredData || datasetData;
    
    container.innerHTML = docs.map(doc => `
        <div class="document-card" onclick="showDocumentDetails('${doc.file_name}')">
            <div class="document-header">
                <div class="document-title">${doc.file_name}</div>
                <div class="document-status status-${doc.status}">${doc.status}</div>
            </div>
            <div class="document-meta">
                Processed: ${new Date(doc.processing_timestamp || 0).toLocaleString()}
            </div>
            <div class="document-stats">
                <div class="stat-item">
                    <span class="stat-label">Pages:</span>
                    <span class="stat-value">${doc.document_info?.total_pages || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Text Length:</span>
                    <span class="stat-value">${(doc.document_info?.text_length || 0).toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Blocks:</span>
                    <span class="stat-value">${doc.blocks?.length || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tables:</span>
                    <span class="stat-value">${doc.tables?.length || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter documents
function filterDocuments() {
    if (!datasetData) return;
    
    const searchTerm = document.getElementById('doc-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    
    filteredData = datasetData.filter(doc => {
        const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    sortDocuments();
}

// Sort documents
function sortDocuments() {
    const sortBy = document.getElementById('sort-by')?.value || 'filename';
    
    if (!filteredData) return;
    
    filteredData.sort((a, b) => {
        switch(sortBy) {
            case 'filename':
                return a.file_name.localeCompare(b.file_name);
            case 'date':
                return new Date(b.processing_timestamp || 0) - new Date(a.processing_timestamp || 0);
            case 'pages':
                return (b.document_info?.total_pages || 0) - (a.document_info?.total_pages || 0);
            default:
                return 0;
        }
    });
    
    if (currentView === 'documents') {
        renderDocuments();
    }
}

// Render blocks view
function renderBlocks() {
    if (!datasetData) return;
    
    const tbody = document.getElementById('blocks-tbody');
    if (!tbody) return;
    
    // Collect all blocks from all documents
    const allBlocks = [];
    datasetData.forEach(doc => {
        if (doc.status === 'success') {
            ['blocks', 'paragraphs', 'lines', 'tokens'].forEach(type => {
                if (doc[type]) {
                    doc[type].forEach(block => {
                        allBlocks.push({
                            ...block,
                            document: doc.file_name,
                            type: type.slice(0, -1) // Remove 's' from end
                        });
                    });
                }
            });
        }
    });
    
    // Limit to first 1000 for performance
    const blocksToShow = allBlocks.slice(0, 1000);
    
    tbody.innerHTML = blocksToShow.map(block => `
        <tr>
            <td>${block.document}</td>
            <td>${block.page_number || '-'}</td>
            <td><span class="badge badge-${block.type}">${block.type}</span></td>
            <td title="${escapeHtml(block.text || '')}">${truncateText(block.text || '', 100)}</td>
            <td>${formatBoundingBox(block.bounding_box)}</td>
            <td>${block.confidence ? (block.confidence * 100).toFixed(1) + '%' : '-'}</td>
        </tr>
    `).join('');
}

// Filter blocks
function filterBlocks() {
    // Implementation for filtering blocks
    // This would filter the blocks table based on search and type filters
}

// Render tables view
function renderTables() {
    if (!datasetData) return;
    
    const container = document.getElementById('tables-container');
    if (!container) return;
    
    // Collect all tables from all documents
    const allTables = [];
    datasetData.forEach(doc => {
        if (doc.status === 'success' && doc.tables) {
            doc.tables.forEach(table => {
                allTables.push({
                    ...table,
                    document: doc.file_name
                });
            });
        }
    });
    
    container.innerHTML = `
        <div class="tables-summary">
            <h3>Tables Found: ${allTables.length}</h3>
        </div>
        ${allTables.map((table, index) => `
            <div class="table-card">
                <div class="table-header">
                    <h4>Table ${index + 1} - ${table.document}</h4>
                    <span class="table-info">Page ${table.page_number || '?'} • ${table.rows_count || 0} rows</span>
                </div>
                <div class="table-preview">
                    ${renderTablePreview(table)}
                </div>
            </div>
        `).join('')}
    `;
}

// Render table preview
function renderTablePreview(table) {
    if (!table.cells || table.cells.length === 0) {
        return '<p class="text-muted">No cell data available</p>';
    }
    
    // Group cells by row
    const rows = {};
    table.cells.forEach(cell => {
        const rowIndex = cell.row_index || 0;
        if (!rows[rowIndex]) rows[rowIndex] = [];
        rows[rowIndex][cell.cell_index || 0] = cell;
    });
    
    const sortedRows = Object.keys(rows).sort((a, b) => a - b).slice(0, 5); // Show max 5 rows
    
    return `
        <table class="table-preview-table">
            ${sortedRows.map(rowIndex => `
                <tr>
                    ${rows[rowIndex].map(cell => `
                        <td>${truncateText(cell?.text || '', 50)}</td>
                    `).join('')}
                </tr>
            `).join('')}
        </table>
    `;
}

// Render pages view
function renderPages() {
    if (!datasetData) return;
    
    const container = document.getElementById('pages-container');
    if (!container) return;
    
    // Collect all pages from all documents
    const allPages = [];
    datasetData.forEach(doc => {
        if (doc.status === 'success' && doc.pages) {
            doc.pages.forEach(page => {
                allPages.push({
                    ...page,
                    document: doc.file_name
                });
            });
        }
    });
    
    container.innerHTML = `
        <div class="pages-summary">
            <h3>Total Pages: ${allPages.length}</h3>
        </div>
        <div class="pages-grid">
            ${allPages.map(page => `
                <div class="page-card">
                    <div class="page-header">
                        <h4>${page.document}</h4>
                        <span class="page-number">Page ${page.page_number}</span>
                    </div>
                    <div class="page-stats">
                        <div class="stat-item">
                            <span class="stat-label">Dimensions:</span>
                            <span class="stat-value">${Math.round(page.width || 0)} × ${Math.round(page.height || 0)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Blocks:</span>
                            <span class="stat-value">${page.blocks_count || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tables:</span>
                            <span class="stat-value">${page.tables_count || 0}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render search view
function renderSearch() {
    // Search view is mainly handled by the search functions
}

// Global search
function globalSearch() {
    // Implementation for real-time search as user types
}

// Perform global search
function performGlobalSearch() {
    const searchTerm = document.getElementById('global-search')?.value.toLowerCase();
    if (!searchTerm || !datasetData) return;
    
    const searchText = document.getElementById('search-text')?.checked;
    const searchFilenames = document.getElementById('search-filenames')?.checked;
    const searchTables = document.getElementById('search-tables')?.checked;
    
    const results = [];
    
    datasetData.forEach(doc => {
        if (doc.status !== 'success') return;
        
        // Search filenames
        if (searchFilenames && doc.file_name.toLowerCase().includes(searchTerm)) {
            results.push({
                type: 'filename',
                document: doc.file_name,
                match: doc.file_name,
                context: 'Document name'
            });
        }
        
        // Search text blocks
        if (searchText && doc.blocks) {
            doc.blocks.forEach(block => {
                if (block.text && block.text.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'text',
                        document: doc.file_name,
                        page: block.page_number,
                        match: block.text,
                        context: `Page ${block.page_number}, ${block.element_type}`
                    });
                }
            });
        }
        
        // Search table content
        if (searchTables && doc.tables) {
            doc.tables.forEach(table => {
                table.cells?.forEach(cell => {
                    if (cell.text && cell.text.toLowerCase().includes(searchTerm)) {
                        results.push({
                            type: 'table',
                            document: doc.file_name,
                            page: table.page_number,
                            match: cell.text,
                            context: `Page ${table.page_number}, Table ${table.table_number}`
                        });
                    }
                });
            });
        }
    });
    
    displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = '<p class="text-muted">No results found.</p>';
        return;
    }
    
    container.innerHTML = `
        <h4>Search Results (${results.length})</h4>
        <div class="search-results-list">
            ${results.slice(0, 100).map(result => `
                <div class="search-result-item">
                    <div class="result-type">${result.type}</div>
                    <div class="result-document">${result.document}</div>
                    <div class="result-context">${result.context}</div>
                    <div class="result-match">${highlightMatch(result.match, document.getElementById('global-search').value)}</div>
                </div>
            `).join('')}
        </div>
        ${results.length > 100 ? `<p class="text-muted">Showing first 100 results of ${results.length} total.</p>` : ''}
    `;
}

// Show document details in modal
function showDocumentDetails(fileName) {
    const doc = datasetData?.find(d => d.file_name === fileName);
    if (!doc) return;
    
    const modal = document.getElementById('document-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = `Document Details - ${fileName}`;
    
    body.innerHTML = `
        <div class="document-details">
            <div class="detail-section">
                <h3>Basic Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>File Name:</label>
                        <span>${doc.file_name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="document-status status-${doc.status}">${doc.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Processing Time:</label>
                        <span>${new Date(doc.processing_timestamp || 0).toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Pages:</label>
                        <span>${doc.document_info?.total_pages || 0}</span>
                    </div>
                    <div class="detail-item">
                        <label>Text Length:</label>
                        <span>${(doc.document_info?.text_length || 0).toLocaleString()} characters</span>
                    </div>
                </div>
            </div>
            
            ${doc.status === 'success' ? `
                <div class="detail-section">
                    <h3>Content Statistics</h3>
                    <div class="stats-row">
                        <div class="stat-box">
                            <div class="stat-number">${doc.blocks?.length || 0}</div>
                            <div class="stat-label">Text Blocks</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${doc.paragraphs?.length || 0}</div>
                            <div class="stat-label">Paragraphs</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${doc.lines?.length || 0}</div>
                            <div class="stat-label">Lines</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${doc.tables?.length || 0}</div>
                            <div class="stat-label">Tables</div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Page Details</h3>
                    <div class="pages-detail">
                        ${doc.pages?.map(page => `
                            <div class="page-detail-item">
                                <strong>Page ${page.page_number}:</strong> 
                                ${Math.round(page.width || 0)} × ${Math.round(page.height || 0)} pixels,
                                ${page.blocks_count || 0} blocks,
                                ${page.tables_count || 0} tables
                            </div>
                        `).join('') || 'No page details available'}
                    </div>
                </div>
            ` : `
                <div class="detail-section">
                    <h3>Error Information</h3>
                    <div class="error-detail">
                        ${doc.error || 'No error details available'}
                    </div>
                </div>
            `}
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('document-modal').style.display = 'none';
}

// Export data
function exportData() {
    if (!datasetData) return;
    
    const dataStr = JSON.stringify(datasetData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `document_ai_dataset_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// PDF Viewer Variables
let currentPDF = null;
let currentPage = 1;
let totalPages = 0;
let currentZoom = 1.0;
let currentDocumentData = null;
let isEditMode = false;
let selectedBoundingBox = null;
let editHistory = [];
let editHistoryIndex = -1;

// PDF Viewer Functions
function setupPDFViewerEventListeners() {
    // PDF selection
    const pdfSelect = document.getElementById('pdf-select');
    if (pdfSelect) pdfSelect.addEventListener('change', loadSelectedPDF);
    
    // Page navigation
    const prevPage = document.getElementById('prev-page');
    if (prevPage) prevPage.addEventListener('click', () => changePage(-1));
    
    const nextPage = document.getElementById('next-page');
    if (nextPage) nextPage.addEventListener('click', () => changePage(1));
    
    // Zoom controls
    const zoomIn = document.getElementById('zoom-in');
    if (zoomIn) zoomIn.addEventListener('click', () => changeZoom(0.2));
    
    const zoomOut = document.getElementById('zoom-out');
    if (zoomOut) zoomOut.addEventListener('click', () => changeZoom(-0.2));
    
    // Element toggles
    const toggles = ['show-blocks', 'show-paragraphs', 'show-lines', 'show-tokens', 'show-tables'];
    toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) toggle.addEventListener('change', updateBoundingBoxVisibility);
    });
    
    // Close element info panel
    const closeElementInfo = document.getElementById('close-element-info');
    if (closeElementInfo) closeElementInfo.addEventListener('click', closeElementInfoPanel);
    
    // Edit mode controls
    const editModeToggle = document.getElementById('edit-mode');
    if (editModeToggle) editModeToggle.addEventListener('change', toggleEditMode);
    
    const saveEdits = document.getElementById('save-edits');
    if (saveEdits) saveEdits.addEventListener('click', saveEditChanges);
    
    const undoEdit = document.getElementById('undo-edit');
    if (undoEdit) undoEdit.addEventListener('click', undoLastEdit);
    
    const redoEdit = document.getElementById('redo-edit');
    if (redoEdit) redoEdit.addEventListener('click', redoLastEdit);
    
    const resetEdits = document.getElementById('reset-edits');
    if (resetEdits) resetEdits.addEventListener('click', resetAllEdits);
}

function renderPDFViewer() {
    if (!datasetData) return;
    
    // Populate PDF selector
    const pdfSelect = document.getElementById('pdf-select');
    if (!pdfSelect) return;
    
    // Clear existing options
    pdfSelect.innerHTML = '<option value="">Select a document to view...</option>';
    
    // Add successful documents
    const successfulDocs = datasetData.filter(doc => doc.status === 'success');
    successfulDocs.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.file_name;
        option.textContent = doc.file_name;
        pdfSelect.appendChild(option);
    });
    
    // Add info about PDF requirements
    if (successfulDocs.length > 0) {
        console.log('📋 Available documents for PDF viewing:');
        successfulDocs.forEach(doc => {
            console.log(`  - ${doc.file_name}`);
        });
        console.log('💡 Make sure these PDF files exist in the PDFs/ directory');
    }
    
    // Reset viewer state
    resetPDFViewer();
}

function resetPDFViewer() {
    currentPDF = null;
    currentPage = 1;
    totalPages = 0;
    currentZoom = 1.0;
    currentDocumentData = null;
    
    // Clear canvas and overlay
    const canvas = document.getElementById('pdf-canvas');
    const overlay = document.getElementById('pdf-overlay');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (overlay) overlay.innerHTML = '';
    
    // Update UI
    updatePageControls();
    updateZoomLevel();
    closeElementInfoPanel();
}

async function loadSelectedPDF() {
    const pdfSelect = document.getElementById('pdf-select');
    const selectedFile = pdfSelect?.value;
    
    if (!selectedFile) {
        resetPDFViewer();
        return;
    }
    
    // Find the document data
    currentDocumentData = datasetData.find(doc => doc.file_name === selectedFile);
    if (!currentDocumentData) {
        showPDFError('Document data not found');
        return;
    }
    
    showPDFLoading(true);
    
    try {
        // First, let's try to get a directory listing to help with debugging
        console.log(`🔍 Current page URL: ${window.location.href}`);
        console.log(`🔍 Current origin: ${window.location.origin}`);
        
        try {
            const dirResponse = await fetch('../PDFs/');
            console.log(`📁 Testing PDFs directory access: ${dirResponse.status}`);
            if (dirResponse.ok) {
                console.log('📁 PDFs directory is accessible');
            } else {
                console.log(`📁 PDFs directory returned: ${dirResponse.status} ${dirResponse.statusText}`);
            }
        } catch (e) {
            console.log(`📁 Cannot access PDFs directory: ${e.message}`);
        }
        
        // Test if we can access the parent directory at all
        try {
            const parentTest = await fetch('../');
            console.log(`📁 Parent directory access: ${parentTest.status}`);
        } catch (e) {
            console.log(`📁 Cannot access parent directory: ${e.message}`);
        }
        // Try to load PDF from different possible paths
        // Server now serves from parent directory, so PDFs are at /PDFs/
        const possiblePaths = [
            `/PDFs/${selectedFile}`,                      // Primary path (server root/PDFs/)
            `/pdfs/${selectedFile}`,                      // Lowercase variant  
            `http://localhost:8000/PDFs/${selectedFile}`, // Full localhost URL
            `http://127.0.0.1:8000/PDFs/${selectedFile}`, // Full 127.0.0.1 URL
            `PDFs/${selectedFile}`,                       // Without leading slash
            `pdfs/${selectedFile}`,                       // Lowercase without leading slash
            `../PDFs/${selectedFile}`,                    // Legacy relative path
            `../pdfs/${selectedFile}`,                    // Legacy lowercase
            selectedFile                                  // Just the filename
        ];
        
        let pdfData = null;
        let foundPath = '';
        
        console.log(`🔍 Searching for PDF: ${selectedFile}`);
        
        for (const path of possiblePaths) {
            try {
                console.log(`  Trying: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    console.log(`  ✅ Found PDF at: ${path}`);
                    pdfData = await response.arrayBuffer();
                    foundPath = path;
                    break;
                } else {
                    console.log(`  ❌ ${path} - Status: ${response.status}`);
                }
            } catch (e) {
                console.log(`  ❌ ${path} - Error: ${e.message}`);
            }
        }
        
        if (!pdfData) {
            console.log('❌ PDF file not found in any location');
            console.log('💡 Please ensure:');
            console.log('   1. PDF files are in the PDFs/ directory');
            console.log('   2. Filenames match exactly (case-sensitive)');
            console.log('   3. You are using a web server (python launch.py)');
            throw new Error(`PDF file "${selectedFile}" not found. Check console for details.`);
        }
        
        console.log(`📄 Loading PDF from: ${foundPath}`);
        
        // Load PDF with PDF.js
        currentPDF = await pdfjsLib.getDocument(pdfData).promise;
        totalPages = currentPDF.numPages;
        currentPage = 1;
        
        await renderCurrentPage();
        updatePageControls();
        showPDFLoading(false);
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        showPDFError(`Unable to load PDF: ${error.message}`);
        showPDFLoading(false);
    }
}

async function renderCurrentPage() {
    if (!currentPDF) return;
    
    try {
        const page = await currentPDF.getPage(currentPage);
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        
        // Calculate viewport
        const viewport = page.getViewport({ scale: currentZoom });
        
        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Render bounding boxes
        renderBoundingBoxes(viewport);
        
    } catch (error) {
        console.error('Error rendering page:', error);
        showPDFError(`Error rendering page: ${error.message}`);
    }
}

function renderBoundingBoxes(viewport) {
    const overlay = document.getElementById('pdf-overlay');
    if (!overlay || !currentDocumentData) return;
    
    // Set overlay dimensions to match canvas
    overlay.style.width = viewport.width + 'px';
    overlay.style.height = viewport.height + 'px';
    
    // Clear existing boxes
    overlay.innerHTML = '';
    
    // Get current page data
    const pageData = currentDocumentData.pages?.find(p => p.page_number === currentPage);
    if (!pageData) {
        console.warn(`📄 No page data found for page ${currentPage}`);
        return;
    }
    
    // Debug page dimensions
    console.log(`🖼️ Page ${currentPage} dimensions:`, {
        viewport: { width: viewport.width, height: viewport.height },
        docAI: { width: pageData.width, height: pageData.height },
        scaleFactors: { x: viewport.width / pageData.width, y: viewport.height / pageData.height }
    });
    
    // Element types to render
    const elementTypes = [
        { type: 'blocks', data: currentDocumentData.blocks, show: 'show-blocks' },
        { type: 'paragraphs', data: currentDocumentData.paragraphs, show: 'show-paragraphs' },
        { type: 'lines', data: currentDocumentData.lines, show: 'show-lines' },
        { type: 'tokens', data: currentDocumentData.tokens, show: 'show-tokens' },
        { type: 'tables', data: currentDocumentData.tables, show: 'show-tables' }
    ];
    
    elementTypes.forEach(({ type, data, show }) => {
        const shouldShow = document.getElementById(show)?.checked;
        if (!shouldShow || !data) return;
        
        // Filter elements for current page
        const pageElements = data.filter(element => element.page_number === currentPage);
        
        pageElements.forEach((element, index) => {
            if (element.bounding_box && element.bounding_box.length >= 4) {
                createBoundingBoxElement(element, type, index, viewport);
            }
        });
    });
}

function createBoundingBoxElement(element, type, index, viewport) {
    const overlay = document.getElementById('pdf-overlay');
    const bbox = element.bounding_box;
    
    // Get current page data from Document AI
    const pageData = currentDocumentData.pages?.find(p => p.page_number === currentPage);
    if (!pageData) {
        console.warn(`📄 No page data found for page ${currentPage}`);
        return;
    }
    
    // Document AI returns bounding boxes as [x, y] coordinates
    // We need to find the min/max to create a proper rectangle
    const x1 = Math.min(...bbox.map(p => p[0]));
    const y1 = Math.min(...bbox.map(p => p[1]));
    const x2 = Math.max(...bbox.map(p => p[0]));
    const y2 = Math.max(...bbox.map(p => p[1]));
    
    // Get Document AI page dimensions (actual page size from JSON)
    const docAI_width = pageData.width;
    const docAI_height = pageData.height;
    
    // Get viewport dimensions (displayed PDF size)
    const viewport_width = viewport.width;
    const viewport_height = viewport.height;
    
    // Calculate scaling factors
    const scaleX = viewport_width / docAI_width;
    const scaleY = viewport_height / docAI_height;
    
    // Scale Document AI coordinates to viewport coordinates
    // Document AI uses top-left origin (0,0 at top-left)
    // The viewport also uses top-left origin for display purposes
    const scaledX1 = x1 * scaleX;
    const scaledY1 = y1 * scaleY;
    const scaledX2 = x2 * scaleX;
    const scaledY2 = y2 * scaleY;
    
    // Calculate final position and dimensions
    const finalLeft = Math.min(scaledX1, scaledX2);
    const finalTop = Math.min(scaledY1, scaledY2);
    const width = Math.abs(scaledX2 - scaledX1);
    const height = Math.abs(scaledY2 - scaledY1);
    
    // Create bounding box element
    const boxElement = document.createElement('div');
    boxElement.className = `bounding-box ${type}`;
    boxElement.style.left = finalLeft + 'px';
    boxElement.style.top = finalTop + 'px';
    boxElement.style.width = width + 'px';
    boxElement.style.height = height + 'px';
    
    // Add debug info as data attributes
    boxElement.setAttribute('data-element-type', type);
    boxElement.setAttribute('data-original-coords', JSON.stringify(bbox));
    boxElement.setAttribute('data-docai-dims', `${docAI_width}x${docAI_height}`);
    boxElement.setAttribute('data-viewport-dims', `${viewport_width}x${viewport_height}`);
    boxElement.setAttribute('data-scale-factors', `${scaleX.toFixed(3)}x${scaleY.toFixed(3)}`);
    boxElement.setAttribute('data-final-coords', `[${finalLeft.toFixed(1)},${finalTop.toFixed(1)}] ${width.toFixed(1)}x${height.toFixed(1)}`);
    
    // Add click handler to show element info
    boxElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showElementInfo(element, type);
        highlightBoundingBox(boxElement);
        
        // Debug logging
        console.log(`📦 ${type} clicked:`, {
            originalCoords: bbox,
            docAI_dims: { width: docAI_width, height: docAI_height },
            viewport_dims: { width: viewport_width, height: viewport_height },
            scaleFactors: { x: scaleX, y: scaleY },
            scaledCoords: { x1: scaledX1, y1: scaledY1, x2: scaledX2, y2: scaledY2 },
            finalPosition: { left: finalLeft, top: finalTop, width, height },
            text: element.text?.substring(0, 50) + '...'
        });
    });
    
    // Add hover effects
    boxElement.addEventListener('mouseenter', () => {
        boxElement.style.opacity = '0.8';
    });
    
    boxElement.addEventListener('mouseleave', () => {
        boxElement.style.opacity = '1';
    });
    
    // Enable editing if edit mode is active
    if (isEditMode) {
        makeBoundingBoxEditable(boxElement);
    }
    
    overlay.appendChild(boxElement);
}

function showElementInfo(element, type) {
    const panel = document.getElementById('element-info-panel');
    const title = document.getElementById('element-info-title');
    const content = document.getElementById('element-info-content');
    
    if (!panel || !title || !content) return;
    
    // Set title
    title.textContent = `${type.charAt(0).toUpperCase() + type.slice(0, -1)} Information`;
    
    // Build content
    let html = '';
    
    // Basic info
    html += `
        <div class="element-detail">
            <div class="element-label">Type</div>
            <div class="element-value">${type.slice(0, -1)}</div>
        </div>
    `;
    
    if (element.page_number) {
        html += `
            <div class="element-detail">
                <div class="element-label">Page</div>
                <div class="element-value">${element.page_number}</div>
            </div>
        `;
    }
    
    if (element.text) {
        html += `
            <div class="element-detail">
                <div class="element-label">Text Content</div>
                <div class="element-text">${escapeHtml(element.text)}</div>
            </div>
        `;
    }
    
    if (element.confidence !== undefined && element.confidence !== null) {
        const confidencePercent = Math.round(element.confidence * 100);
        html += `
            <div class="element-detail">
                <div class="element-label">Confidence</div>
                <div class="element-value">${confidencePercent}%</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                </div>
            </div>
        `;
    }
    
    if (element.bounding_box && element.bounding_box.length > 0) {
        html += `
            <div class="element-detail">
                <div class="element-label">Bounding Box Coordinates</div>
                <div class="coordinates-grid">
        `;
        
        element.bounding_box.forEach((point, index) => {
            html += `
                <div class="coordinate-item">
                    Point ${index + 1}: (${Math.round(point[0])}, ${Math.round(point[1])})
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Additional type-specific info
    if (type === 'tables' && element.cells) {
        html += `
            <div class="element-detail">
                <div class="element-label">Table Info</div>
                <div class="element-value">
                    Rows: ${element.rows_count || 0}<br>
                    Header Rows: ${element.header_rows_count || 0}<br>
                    Total Cells: ${element.cells.length}
                </div>
            </div>
        `;
    }
    
    content.innerHTML = html;
    panel.style.display = 'block';
}

function highlightBoundingBox(boxElement) {
    // Remove previous highlights
    document.querySelectorAll('.bounding-box.highlighted').forEach(box => {
        box.classList.remove('highlighted');
    });
    
    // Highlight current box
    boxElement.classList.add('highlighted');
}

function closeElementInfoPanel() {
    const panel = document.getElementById('element-info-panel');
    if (panel) panel.style.display = 'none';
    
    // Remove highlights
    document.querySelectorAll('.bounding-box.highlighted').forEach(box => {
        box.classList.remove('highlighted');
    });
}

function changePage(delta) {
    if (!currentPDF) return;
    
    const newPage = currentPage + delta;
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    renderCurrentPage();
    updatePageControls();
    closeElementInfoPanel();
}

function changeZoom(delta) {
    const newZoom = currentZoom + delta;
    if (newZoom < 0.25 || newZoom > 3.0) return;
    
    currentZoom = newZoom;
    renderCurrentPage();
    updateZoomLevel();
    closeElementInfoPanel();
}

function updatePageControls() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function updateZoomLevel() {
    const zoomLevel = document.getElementById('zoom-level');
    if (zoomLevel) zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
}

function updateBoundingBoxVisibility() {
    if (currentPDF) {
        renderCurrentPage();
    }
}

function showPDFLoading(show) {
    const loading = document.getElementById('pdf-loading');
    const error = document.getElementById('pdf-error');
    const canvasContainer = document.querySelector('.pdf-canvas-container');
    
    if (show) {
        if (loading) loading.style.display = 'flex';
        if (error) error.style.display = 'none';
        if (canvasContainer) canvasContainer.style.display = 'none';
    } else {
        if (loading) loading.style.display = 'none';
        if (canvasContainer) canvasContainer.style.display = 'block';
    }
}

function showPDFError(message) {
    const error = document.getElementById('pdf-error');
    const loading = document.getElementById('pdf-loading');
    const canvasContainer = document.querySelector('.pdf-canvas-container');
    
    if (error) {
        error.style.display = 'flex';
        const errorText = error.querySelector('p');
        if (errorText) errorText.textContent = message;
    }
    
    if (loading) loading.style.display = 'none';
    if (canvasContainer) canvasContainer.style.display = 'none';
}

// Utility functions
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatBoundingBox(bbox) {
    if (!bbox || !Array.isArray(bbox) || bbox.length === 0) return '-';
    return `${bbox.length} points`;
}

function highlightMatch(text, searchTerm) {
    if (!searchTerm) return escapeHtml(text);
    
    const regex = new RegExp(`(${escapeHtml(searchTerm)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

// Edit Mode Functions
function toggleEditMode() {
    const editModeCheckbox = document.getElementById('edit-mode');
    isEditMode = editModeCheckbox?.checked || false;
    
    console.log(`🔧 Edit mode ${isEditMode ? 'enabled' : 'disabled'}`);
    
    // Update UI
    updateEditModeUI();
    
    // Update existing bounding boxes
    const boundingBoxes = document.querySelectorAll('.bounding-box');
    boundingBoxes.forEach(box => {
        if (isEditMode) {
            makeBoundingBoxEditable(box);
        } else {
            removeBoundingBoxEditable(box);
        }
    });
}

function updateEditModeUI() {
    const saveBtn = document.getElementById('save-edits');
    const undoBtn = document.getElementById('undo-edit');
    const redoBtn = document.getElementById('redo-edit');
    const resetBtn = document.getElementById('reset-edits');
    const editStatus = document.getElementById('edit-status');
    
    if (isEditMode) {
        if (saveBtn) saveBtn.disabled = editHistory.length === 0;
        if (undoBtn) undoBtn.disabled = editHistoryIndex < 0;
        if (redoBtn) redoBtn.disabled = editHistoryIndex >= editHistory.length - 1;
        if (resetBtn) resetBtn.disabled = editHistory.length === 0;
        if (editStatus) {
            editStatus.style.display = 'block';
            updateEditCount();
        }
    } else {
        if (saveBtn) saveBtn.disabled = true;
        if (undoBtn) undoBtn.disabled = true;
        if (redoBtn) redoBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
        if (editStatus) editStatus.style.display = 'none';
    }
}

function makeBoundingBoxEditable(boxElement) {
    boxElement.classList.add('editable');
    
    // Add resize handles
    addResizeHandles(boxElement);
    
    // Add drag functionality
    addDragFunctionality(boxElement);
}

function removeBoundingBoxEditable(boxElement) {
    boxElement.classList.remove('editable', 'selected');
    
    // Remove resize handles
    removeResizeHandles(boxElement);
    
    // Remove drag functionality
    removeDragFunctionality(boxElement);
}

function addResizeHandles(boxElement) {
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${position}`;
        handle.addEventListener('mousedown', (e) => startResize(e, boxElement, position));
        boxElement.appendChild(handle);
    });
}

function removeResizeHandles(boxElement) {
    const handles = boxElement.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
}

function addDragFunctionality(boxElement) {
    boxElement.addEventListener('mousedown', startDrag);
}

function removeDragFunctionality(boxElement) {
    boxElement.removeEventListener('mousedown', startDrag);
}

let dragState = null;

function startDrag(e) {
    if (!isEditMode || e.target.classList.contains('resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const boxElement = e.currentTarget;
    selectBoundingBox(boxElement);
    
    const rect = boxElement.getBoundingClientRect();
    const overlayRect = document.getElementById('pdf-overlay').getBoundingClientRect();
    
    dragState = {
        element: boxElement,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: rect.left - overlayRect.left,
        elementStartY: rect.top - overlayRect.top,
        type: 'drag'
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    console.log('🎯 Started dragging bounding box');
}

function handleDrag(e) {
    if (!dragState || dragState.type !== 'drag') return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const newX = Math.max(0, dragState.elementStartX + deltaX);
    const newY = Math.max(0, dragState.elementStartY + deltaY);
    
    dragState.element.style.left = newX + 'px';
    dragState.element.style.top = newY + 'px';
}

function endDrag(e) {
    if (!dragState) return;
    
    if (dragState.type === 'drag') {
        // Save the edit to history
        const elementData = getElementDataFromBox(dragState.element);
        if (elementData) {
            const newCoords = getUpdatedCoordinates(dragState.element);
            const elementType = dragState.element.getAttribute('data-element-type');
            saveEditToHistory(elementData, 'move', newCoords, elementType);
        }
    } else if (dragState.type === 'resize') {
        // Save the resize to history
        const elementData = getElementDataFromBox(dragState.element);
        if (elementData) {
            const newCoords = getUpdatedCoordinates(dragState.element);
            const elementType = dragState.element.getAttribute('data-element-type');
            saveEditToHistory(elementData, 'resize', newCoords, elementType);
        }
    }
    
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', endDrag);
    
    dragState = null;
    updateEditModeUI();
    
    console.log('✅ Finished dragging/resizing');
}

function startResize(e, boxElement, position) {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    selectBoundingBox(boxElement);
    
    const rect = boxElement.getBoundingClientRect();
    const overlayRect = document.getElementById('pdf-overlay').getBoundingClientRect();
    
    dragState = {
        element: boxElement,
        startX: e.clientX,
        startY: e.clientY,
        elementStartX: rect.left - overlayRect.left,
        elementStartY: rect.top - overlayRect.top,
        elementStartWidth: rect.width,
        elementStartHeight: rect.height,
        position: position,
        type: 'resize'
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', endDrag);
    
    console.log(`🔄 Started resizing bounding box (${position})`);
}

function handleResize(e) {
    if (!dragState || dragState.type !== 'resize') return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    let newX = dragState.elementStartX;
    let newY = dragState.elementStartY;
    let newWidth = dragState.elementStartWidth;
    let newHeight = dragState.elementStartHeight;
    
    const position = dragState.position;
    
    // Handle horizontal resizing
    if (position.includes('w')) {
        newX = dragState.elementStartX + deltaX;
        newWidth = dragState.elementStartWidth - deltaX;
    } else if (position.includes('e')) {
        newWidth = dragState.elementStartWidth + deltaX;
    }
    
    // Handle vertical resizing
    if (position.includes('n')) {
        newY = dragState.elementStartY + deltaY;
        newHeight = dragState.elementStartHeight - deltaY;
    } else if (position.includes('s')) {
        newHeight = dragState.elementStartHeight + deltaY;
    }
    
    // Enforce minimum size
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);
    
    // Enforce boundaries
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    // Apply changes
    dragState.element.style.left = newX + 'px';
    dragState.element.style.top = newY + 'px';
    dragState.element.style.width = newWidth + 'px';
    dragState.element.style.height = newHeight + 'px';
}

function selectBoundingBox(boxElement) {
    // Remove selection from other boxes
    document.querySelectorAll('.bounding-box.selected').forEach(box => {
        box.classList.remove('selected');
    });
    
    // Select this box
    boxElement.classList.add('selected');
    selectedBoundingBox = boxElement;
    
    // Show element info
    const elementData = getElementDataFromBox(boxElement);
    if (elementData) {
        const elementType = boxElement.getAttribute('data-element-type');
        showElementInfo(elementData, elementType);
    }
}

function getElementDataFromBox(boxElement) {
    if (!currentDocumentData) return null;
    
    const elementType = boxElement.getAttribute('data-element-type');
    const originalCoords = JSON.parse(boxElement.getAttribute('data-original-coords') || '[]');
    
    // Find the element in the current document data
    const dataArray = currentDocumentData[elementType];
    if (!dataArray) return null;
    
    // Find matching element by comparing bounding box coordinates
    return dataArray.find(element => {
        if (!element.bounding_box || element.page_number !== currentPage) return false;
        return JSON.stringify(element.bounding_box) === JSON.stringify(originalCoords);
    });
}

function getUpdatedCoordinates(boxElement) {
    if (!currentDocumentData) {
        console.warn('❌ No current document data');
        return null;
    }
    
    // Get current page data
    const pageData = currentDocumentData.pages?.find(p => p.page_number === currentPage);
    if (!pageData) {
        console.warn(`❌ No page data for page ${currentPage}`);
        return null;
    }
    
    // Get current viewport dimensions
    const overlay = document.getElementById('pdf-overlay');
    const overlayRect = overlay.getBoundingClientRect();
    const boxRect = boxElement.getBoundingClientRect();
    
    // Calculate relative position within overlay
    const relativeLeft = boxRect.left - overlayRect.left;
    const relativeTop = boxRect.top - overlayRect.top;
    const relativeRight = relativeLeft + boxRect.width;
    const relativeBottom = relativeTop + boxRect.height;
    
    // Convert back to Document AI coordinates
    const scaleX = pageData.width / overlayRect.width;
    const scaleY = pageData.height / overlayRect.height;
    
    const docAI_x1 = relativeLeft * scaleX;
    const docAI_y1 = relativeTop * scaleY;
    const docAI_x2 = relativeRight * scaleX;
    const docAI_y2 = relativeBottom * scaleY;
    
    const newCoords = [
        [docAI_x1, docAI_y1],
        [docAI_x2, docAI_y1],
        [docAI_x2, docAI_y2],
        [docAI_x1, docAI_y2]
    ];
    
    console.log('🔄 Coordinate conversion:', {
        viewport: { left: relativeLeft, top: relativeTop, width: boxRect.width, height: boxRect.height },
        overlay: { width: overlayRect.width, height: overlayRect.height },
        pageData: { width: pageData.width, height: pageData.height },
        scaleFactors: { x: scaleX, y: scaleY },
        docAI_coords: newCoords
    });
    
    return newCoords;
}

function saveEditToHistory(elementData, action, newCoords, elementType) {
    const edit = {
        elementData: elementData,
        elementType: elementType, // Store the element type for saving
        action: action,
        oldCoords: [...elementData.bounding_box],
        newCoords: newCoords,
        timestamp: Date.now()
    };
    
    // Remove any edits after current position (for redo functionality)
    editHistory = editHistory.slice(0, editHistoryIndex + 1);
    
    // Add new edit
    editHistory.push(edit);
    editHistoryIndex = editHistory.length - 1;
    
    // Apply the edit to the data
    elementData.bounding_box = newCoords;
    
    console.log(`📝 Saved edit: ${action}`, edit);
    updateEditCount();
}

function updateEditCount() {
    const editCountElement = document.getElementById('edit-count');
    if (editCountElement) {
        const count = editHistory.length;
        editCountElement.textContent = `${count} change${count !== 1 ? 's' : ''} made`;
    }
}

function undoLastEdit() {
    if (editHistoryIndex < 0) return;
    
    const edit = editHistory[editHistoryIndex];
    
    // Revert the change
    edit.elementData.bounding_box = edit.oldCoords;
    
    editHistoryIndex--;
    updateEditModeUI();
    
    // Refresh the display
    if (currentPDF) {
        renderCurrentPage();
    }
    
    console.log('↶ Undid edit:', edit.action);
}

function redoLastEdit() {
    if (editHistoryIndex >= editHistory.length - 1) return;
    
    editHistoryIndex++;
    const edit = editHistory[editHistoryIndex];
    
    // Reapply the change
    edit.elementData.bounding_box = edit.newCoords;
    
    updateEditModeUI();
    
    // Refresh the display
    if (currentPDF) {
        renderCurrentPage();
    }
    
    console.log('↷ Redid edit:', edit.action);
}

function resetAllEdits() {
    if (editHistory.length === 0) return;
    
    const confirmReset = confirm('Are you sure you want to reset all changes? This cannot be undone.');
    if (!confirmReset) return;
    
    // Revert all changes
    editHistory.forEach(edit => {
        edit.elementData.bounding_box = edit.oldCoords;
    });
    
    // Clear history
    editHistory = [];
    editHistoryIndex = -1;
    
    updateEditModeUI();
    
    // Refresh the display
    if (currentPDF) {
        renderCurrentPage();
    }
    
    console.log('🔄 Reset all edits');
}

function saveEditChanges() {
    if (editHistory.length === 0) {
        alert('No changes to save.');
        return;
    }
    
    console.log('💾 Starting save process...', {
        editHistoryLength: editHistory.length,
        currentDocumentData: currentDocumentData?.file_name,
        datasetData: !!datasetData
    });
    
    // Create updated dataset
    const updatedDataset = JSON.parse(JSON.stringify(datasetData));
    let changesApplied = 0;
    
    // Apply all changes to the dataset
    editHistory.forEach((edit, editIndex) => {
        console.log(`📝 Processing edit ${editIndex + 1}:`, edit);
        
        // Find the document in the updated dataset
        const doc = updatedDataset.find(d => d.file_name === currentDocumentData.file_name);
        if (!doc) {
            console.warn(`❌ Document not found: ${currentDocumentData.file_name}`);
            return;
        }
        
        // Get the element type from the edit action metadata
        const elementType = edit.elementType || getElementTypeFromBoundingBox(edit.elementData);
        console.log(`🔍 Looking for element type: ${elementType}`);
        
        // Find the element array in the document
        const elementArray = doc[elementType];
        if (!elementArray) {
            console.warn(`❌ Element array not found: ${elementType}`, Object.keys(doc));
            return;
        }
        
        // Find the specific element to update
        const element = findElementInArray(elementArray, edit.elementData, edit.oldCoords);
        
        if (element) {
            console.log(`✅ Found element to update:`, {
                type: elementType,
                page: element.page_number,
                oldCoords: element.bounding_box,
                newCoords: edit.newCoords
            });
            
            element.bounding_box = edit.newCoords;
            changesApplied++;
        } else {
            console.warn(`❌ Element not found in array:`, {
                elementType,
                arrayLength: elementArray.length,
                searchCriteria: {
                    page: edit.elementData.page_number,
                    originalCoords: edit.oldCoords
                }
            });
        }
    });
    
    console.log(`✅ Applied ${changesApplied} out of ${editHistory.length} changes`);
    
    // Download the updated dataset
    const dataStr = JSON.stringify(updatedDataset, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `edited_dataset_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('💾 Download initiated for edited dataset');
    alert(`Saved dataset with ${changesApplied} changes applied!\n\nChanges processed: ${changesApplied}/${editHistory.length}`);
}

function getElementTypeFromBoundingBox(elementData) {
    // Try to determine element type from the data structure
    if (elementData.element_type) return elementData.element_type + 's';
    if (elementData.table_number !== undefined) return 'tables';
    if (elementData.field_number !== undefined) return 'form_fields';
    
    // Default fallback - assume it's from the current element type being viewed
    const activeToggles = ['blocks', 'paragraphs', 'lines', 'tokens', 'tables'].filter(type => {
        const toggle = document.getElementById(`show-${type}`);
        return toggle?.checked;
    });
    
    return activeToggles[0] || 'blocks';
}

function findElementInArray(elementArray, targetElement, originalCoords) {
    // Try to find by exact coordinate match first
    let found = elementArray.find(el => 
        el.page_number === targetElement.page_number &&
        JSON.stringify(el.bounding_box) === JSON.stringify(originalCoords)
    );
    
    if (found) return found;
    
    // Try to find by text content if available
    if (targetElement.text && targetElement.text.trim()) {
        found = elementArray.find(el => 
            el.page_number === targetElement.page_number &&
            el.text && el.text.trim() === targetElement.text.trim()
        );
        
        if (found) {
            console.log('📍 Found element by text match');
            return found;
        }
    }
    
    // Try to find by element number/index if available
    if (targetElement.element_number !== undefined) {
        found = elementArray.find(el => 
            el.page_number === targetElement.page_number &&
            el.element_number === targetElement.element_number
        );
        
        if (found) {
            console.log('📍 Found element by element number');
            return found;
        }
    }
    
    // Last resort: find by approximate coordinate match (within tolerance)
    const tolerance = 5; // pixels
    found = elementArray.find(el => {
        if (el.page_number !== targetElement.page_number || !el.bounding_box) return false;
        
        // Check if coordinates are approximately the same
        if (el.bounding_box.length !== originalCoords.length) return false;
        
        return el.bounding_box.every((coord, i) => {
            const original = originalCoords[i];
            return Math.abs(coord[0] - original[0]) <= tolerance && 
                   Math.abs(coord[1] - original[1]) <= tolerance;
        });
    });
    
    if (found) {
        console.log('📍 Found element by approximate coordinate match');
    }
    
    return found;
} 