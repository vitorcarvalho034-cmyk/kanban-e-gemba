import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Printer, Plus, Download, Upload, Edit2, Trash2, Check, X } from 'lucide-react';
import { useBackup } from '@/hooks/useBackup';

interface KanbanProduct {
  id: string;
  name: string;
  photo: string | null;
  minStock: string;
  supplier: string;
  lastRestockDate: string;
  seasonUsed: string;
}

interface GembaStep {
  id: string;
  stepNumber: number;
  photo: string | null;
  description: string;
}

interface GembaProcess {
  id: string;
  title: string;
  steps: GembaStep[];
}

const STORAGE_KEY = 'kanban-products';
const GEMBA_STORAGE_KEY = 'gemba-processes';

export default function Home() {
  const [activeTab, setActiveTab] = useState('kanban');
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [kanbanViewMode, setKanbanViewMode] = useState<'single' | 'dual'>('dual');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { backupHistory, exportBackup, importBackup, restoreFromHistory, formatDate } = useBackup();
  
  // Kanban state
  const [products, setProducts] = useState<KanbanProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<KanbanProduct>({
    id: '',
    name: '',
    photo: null,
    minStock: '',
    supplier: '',
    lastRestockDate: '',
    seasonUsed: '',
  });

  // Gemba state
  const [processes, setProcesses] = useState<GembaProcess[]>([]);
  const [editingGembaId, setEditingGembaId] = useState<string | null>(null);
  const [gembaFormData, setGembaFormData] = useState<GembaProcess>({
    id: '',
    title: '',
    steps: [],
  });
  const [currentStepPhoto, setCurrentStepPhoto] = useState<string | null>(null);
  const [currentStepDescription, setCurrentStepDescription] = useState('');

  // Load data from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEY);
    const savedProcesses = localStorage.getItem(GEMBA_STORAGE_KEY);
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedProcesses) setProcesses(JSON.parse(savedProcesses));
  }, []);

  // Save products to localStorage (without auto-export)
  useEffect(() => {
    if (products.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      } catch (e) {
        console.error('Failed to save products:', e);
      }
    }
  }, [products]);

  // Save processes to localStorage
  useEffect(() => {
    if (processes.length > 0) {
      try {
        localStorage.setItem(GEMBA_STORAGE_KEY, JSON.stringify(processes));
      } catch (e) {
        console.error('Failed to save processes:', e);
      }
    }
  }, [processes]);

  // Kanban handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStream(stream);
      setCameraOpen(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error: any) {
      console.error('Erro na câmera:', error);
      alert(`Erro ao acessar a câmera: ${error?.message || 'Verifique as permissões'}`);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, photo: photoData }));
        handleCloseCamera();
        alert('Foto capturada com sucesso!');
      }
    }
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraOpen(false);
  };

  const handleAddProduct = () => {
    if (!formData.name.trim()) {
      alert('Por favor, preencha o nome do produto');
      return;
    }
    const newProduct: KanbanProduct = {
      ...formData,
      id: Date.now().toString(),
    };
    setProducts(prev => [...prev, newProduct]);
    setFormData({
      id: '',
      name: '',
      photo: null,
      minStock: '',
      supplier: '',
      lastRestockDate: '',
      seasonUsed: '',
    });
  };

  const handleEditProduct = (product: KanbanProduct) => {
    setFormData(product);
    setEditingId(product.id);
  };

  const handleSaveEdit = () => {
    setProducts(prev =>
      prev.map(p => (p.id === editingId ? { ...formData, id: editingId } : p))
    );
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      photo: null,
      minStock: '',
      supplier: '',
      lastRestockDate: '',
      seasonUsed: '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      photo: null,
      minStock: '',
      supplier: '',
      lastRestockDate: '',
      seasonUsed: '',
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handlePrintKanban = () => {
    window.print();
  };

  // Gemba handlers
  const handleAddStep = () => {
    const newStep: GembaStep = {
      id: Date.now().toString(),
      stepNumber: gembaFormData.steps.length + 1,
      photo: currentStepPhoto,
      description: currentStepDescription,
    };
    setGembaFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setCurrentStepPhoto(null);
    setCurrentStepDescription('');
  };

  const handleGembaPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentStepPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGembaProcess = () => {
    if (!gembaFormData.title.trim()) {
      alert('Por favor, preencha o título do processo');
      return;
    }
    if (gembaFormData.steps.length === 0) {
      alert('Por favor, adicione pelo menos uma etapa');
      return;
    }

    if (editingGembaId) {
      setProcesses(prev =>
        prev.map(p =>
          p.id === editingGembaId
            ? { ...gembaFormData, id: editingGembaId }
            : p
        )
      );
      setEditingGembaId(null);
    } else {
      const newProcess: GembaProcess = {
        ...gembaFormData,
        id: Date.now().toString(),
      };
      setProcesses(prev => [...prev, newProcess]);
    }

    setGembaFormData({
      id: '',
      title: '',
      steps: [],
    });
    setCurrentStepPhoto(null);
    setCurrentStepDescription('');
  };

  const handleEditGembaProcess = (process: GembaProcess) => {
    setGembaFormData(process);
    setEditingGembaId(process.id);
  };

  const handleCancelEditGemba = () => {
    setEditingGembaId(null);
    setGembaFormData({
      id: '',
      title: '',
      steps: [],
    });
    setCurrentStepPhoto(null);
    setCurrentStepDescription('');
  };

  const handleDeleteGembaProcess = (id: string) => {
    if (confirm('Tem certeza que deseja remover este processo?')) {
      setProcesses(prev => prev.filter(p => p.id !== id));
    }
  };

  const handlePrintGemba = (processId: string) => {
    const process = processes.find(p => p.id === processId);
    if (!process) return;

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) return;

    const logoUrl = `${window.location.origin}/logo-ft.png`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GEMBA FT - ${process.title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: Arial, sans-serif;
            background: white;
          }
          .header {
            background-color: #16a34a;
            color: white;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header img {
            height: 100px;
          }
          .header-title {
            font-size: 24px;
            font-weight: bold;
            flex: 1;
            text-align: center;
          }
          .header-label {
            font-size: 20px;
            font-weight: bold;
          }
          .process-title {
            font-size: 18px;
            font-weight: bold;
            padding: 12px;
            border-bottom: 2px solid #000;
          }
          .steps-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            padding: 12px;
          }
          .step {
            border: 2px solid #000;
            padding: 8px;
            text-align: center;
          }
          .step-number {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .step-photo {
            width: 100%;
            height: 150px;
            object-fit: cover;
            margin-bottom: 8px;
            border: 1px solid #ccc;
          }
          .step-description {
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Logo FT">
          <div class="header-title">${process.title}</div>
          <div class="header-label">GEMBA FT</div>
        </div>
        <div class="process-title"><strong>${process.title}</strong></div>
        <div class="steps-container">
          ${process.steps.map(step => `
            <div class="step">
              <div class="step-number"><strong>Ponto ${step.stepNumber}</strong></div>
              ${step.photo ? `<img src="${step.photo}" alt="Ponto ${step.stepNumber}" class="step-photo">` : '<div style="width: 100%; height: 150px; background: #f0f0f0; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">Sem foto</div>'}
              <div class="step-description">${step.description || '-'}</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.products) setProducts(data.products);
          if (data.processes) setProcesses(data.processes);
          alert('Dados importados com sucesso!');
        } catch (error) {
          alert('Erro ao importar arquivo');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestoreFromHistory = (backup: any) => {
    setProducts(backup.products);
    setProcesses(backup.processes);
    alert('Dados restaurados com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-4 md:py-8 px-4">
        {/* Header */}
        <div className="mb-8 no-print">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">KANBAN E GEMBA</h1>
          <p className="text-gray-600">Gerenciador de Produtos e Processos GEMBA FT</p>
        </div>

        {/* Backup Menu Button */}
        <div className="mb-6 no-print">
          <Button
            onClick={() => setShowBackupMenu(!showBackupMenu)}
            className="gap-2"
            variant="outline"
          >
            <Download className="w-4 h-4" /> Backup
          </Button>
        </div>

        {/* Backup Menu */}
        {showBackupMenu && (
          <Card className="mb-6 p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Gerenciar Backup</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => exportBackup(products, processes)}
                  className="gap-2 flex-1 text-sm"
                  variant="outline"
                >
                  <Download className="w-4 h-4" /> Exportar
                </Button>
                <label className="flex-1">
                  <Button
                    className="gap-2 w-full text-sm"
                    variant="outline"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" /> Importar
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
              {backupHistory.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs md:text-sm font-medium mb-2">Histórico ({backupHistory.length}):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {backupHistory.map((backup, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRestoreFromHistory(backup)}
                        className="w-full text-left text-xs md:text-sm p-2 hover:bg-gray-100 rounded transition"
                      >
                        <div className="font-medium">{formatDate(backup.timestamp)}</div>
                        <div className="text-gray-600">{backup.products.length} produtos, {backup.processes.length} processos</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 mb-6 border-b border-gray-200 overflow-x-auto no-print">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 md:px-4 py-2 font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'kanban' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          >
            Kanban Produtos
          </button>
          <button
            onClick={() => setActiveTab('gemba')}
            className={`px-3 md:px-4 py-2 font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'gemba' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}
          >
            GEMBA FT
          </button>
        </div>

        {/* Kanban Tab */}
        {activeTab === 'kanban' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6 no-print">
              <h2 className="text-lg md:text-xl font-semibold">Novo Produto</h2>
              <Button onClick={handlePrintKanban} className="gap-2">
                <Printer className="w-4 h-4" /> Imprimir
              </Button>
            </div>

            {/* Kanban Form */}
            <Card className="p-4 md:p-6 no-print">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Produto</label>
                  <Input
                    name="name"
                    placeholder="Ex: Cabrio Top"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!!editingId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Foto do Produto</label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={!!editingId}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleCameraCapture}
                      variant="outline"
                      disabled={!!editingId}
                      className="gap-2"
                    >
                      📷 Câmera
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estoque Mínimo</label>
                  <Input
                    name="minStock"
                    placeholder="Ex: 10 unidades"
                    value={formData.minStock}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fornecedor</label>
                  <Input
                    name="supplier"
                    placeholder="Ex: BASF"
                    value={formData.supplier}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data da Última Reposição</label>
                  <Input
                    name="lastRestockDate"
                    type="date"
                    value={formData.lastRestockDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Época do Ano Utilizado</label>
                  <Input
                    name="seasonUsed"
                    placeholder="Ex: Ano todo"
                    value={formData.seasonUsed}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {editingId ? (
                  <>
                    <Button onClick={handleSaveEdit} className="gap-2 bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4" /> Salvar
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" className="gap-2">
                      <X className="w-4 h-4" /> Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddProduct} className="gap-2 bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4" /> Adicionar
                  </Button>
                )}
              </div>
            </Card>

            {/* Kanban View Mode Selector */}
            {products.length > 0 && (
              <div className="flex gap-2 mb-6 no-print">
                <Button
                  onClick={() => setKanbanViewMode('dual')}
                  className={`gap-2 ${kanbanViewMode === 'dual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  2 Kanbans
                </Button>
                <Button
                  onClick={() => setKanbanViewMode('single')}
                  className={`gap-2 ${kanbanViewMode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  1 Kanban
                </Button>
              </div>
            )}

            {/* Kanban Cards */}
            {products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhum produto adicionado ainda. Preencha o formulário e clique em "Adicionar".
              </div>
            ) : kanbanViewMode === 'dual' ? (
              <div className="print-container space-y-0">
                {products.map((product) => (
                  <div key={product.id} className="kanban-card-wrapper">
                    <div className="kanban-card">
                      {/* KANBAN Header */}
                      <div className="kanban-header"><strong>KANBAN</strong></div>
                      
                      {/* Main Content - Photo + Fields */}
                      <div className="kanban-main-content">
                        {/* Photo on left */}
                        <div className="kanban-photo-small">
                          {product.photo ? (
                            <img src={product.photo} alt={product.name} />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-xs">Sem foto</div>
                          )}
                        </div>
                        
                        {/* Fields on right - only labels, blank spaces for writing */}
                        <div className="kanban-fields-column">
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>NOME DO PRODUTO:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>FORNECEDOR:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>INSUMOS/CELEIRO:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>ESTOQUE MÍNIMO:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* INFORMAÇÕES Section - Large blank area at bottom */}
                      <div className="kanban-info-section">
                        <div className="kanban-info-header"><strong>INFORMAÇÕES</strong></div>
                        <div className="kanban-info-blank"></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 no-print">
                      <Button
                        onClick={() => handleEditProduct(product)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        variant="outline"
                        className="gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" /> Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="print-container space-y-0">
                {products.map((product) => (
                  <div key={product.id} className="kanban-card-wrapper-single">
                    <div className="kanban-card">
                      {/* KANBAN Header */}
                      <div className="kanban-header"><strong>KANBAN</strong></div>
                      
                      {/* Main Content - Photo + Fields */}
                      <div className="kanban-main-content">
                        {/* Photo on left */}
                        <div className="kanban-photo-small">
                          {product.photo ? (
                            <img src={product.photo} alt={product.name} />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-xs">Sem foto</div>
                          )}
                        </div>
                        
                        {/* Fields on right - only labels, blank spaces for writing */}
                        <div className="kanban-fields-column">
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>NOME DO PRODUTO:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>FORNECEDOR:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>INSUMOS/CELEIRO:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                          <div className="kanban-field-row">
                            <div className="field-label"><strong>ESTOQUE MÍNIMO:</strong></div>
                            <div className="field-blank"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* INFORMAÇÕES Section - Large blank area at bottom */}
                      <div className="kanban-info-section">
                        <div className="kanban-info-header"><strong>INFORMAÇÕES</strong></div>
                        <div className="kanban-info-blank"></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 no-print">
                      <Button
                        onClick={() => handleEditProduct(product)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        variant="outline"
                        className="gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" /> Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gemba Tab */}
        {activeTab === 'gemba' && (
          <div className="space-y-6">
            <h2 className="text-lg md:text-xl font-semibold no-print">Novo Processo GEMBA FT</h2>

            {/* Gemba Form */}
            <Card className="p-4 md:p-6 no-print">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Título do Processo</label>
                <Input
                  placeholder="Ex: Preparação de Mudas"
                  value={gembaFormData.title}
                  onChange={(e) => setGembaFormData(prev => ({ ...prev, title: e.target.value }))}
                  disabled={!!editingGembaId}
                />
              </div>

              {/* Steps */}
              {gembaFormData.steps.length > 0 && (
                <div className="mb-4 border-t pt-4">
                  <p className="text-sm font-medium mb-2">Etapas ({gembaFormData.steps.length}):</p>
                  <div className="grid grid-cols-3 gap-4">
                    {gembaFormData.steps.map((step) => (
                      <div key={step.id} className="border rounded-lg p-3 text-center">
                        <div className="font-bold mb-2">Ponto {step.stepNumber}</div>
                        {step.photo ? (
                          <img src={step.photo} alt={`Ponto ${step.stepNumber}`} className="w-full h-32 object-cover rounded mb-2" />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">Sem foto</div>
                        )}
                        {step.description && <p className="text-sm text-gray-600">{step.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Step Section */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Adicionar Etapa</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Foto da Etapa</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleGembaPhotoChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <Input
                      placeholder="Descrição da etapa"
                      value={currentStepDescription}
                      onChange={(e) => setCurrentStepDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddStep} className="gap-2" variant="outline">
                  <Plus className="w-4 h-4" /> Adicionar Etapa
                </Button>
                <Button onClick={handleCreateGembaProcess} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4" /> {editingGembaId ? 'Salvar Alterações' : 'Criar Processo'}
                </Button>
                {editingGembaId && (
                  <Button onClick={handleCancelEditGemba} variant="outline" className="gap-2">
                    <X className="w-4 h-4" /> Cancelar
                  </Button>
                )}
              </div>
            </Card>

            {/* Gemba Processes */}
            {processes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhum processo criado ainda. Preencha o formulário e clique em "Criar Processo".
              </div>
            ) : (
              <div className="space-y-6">
                {processes.map((process) => (
                  <Card key={process.id} className="p-4 md:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{process.title}</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePrintGemba(process.id)}
                          className="gap-2"
                        >
                          <Printer className="w-4 h-4" /> Imprimir
                        </Button>
                        <Button
                          onClick={() => handleEditGembaProcess(process)}
                          variant="outline"
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteGembaProcess(process.id)}
                          variant="outline"
                          className="gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" /> Remover
                        </Button>
                      </div>
                    </div>

                    {/* Steps Preview */}
                    <div className="grid grid-cols-3 gap-4">
                      {process.steps.map((step) => (
                        <div key={step.id} className="border rounded-lg p-3 text-center">
                          <div className="font-bold mb-2">Ponto {step.stepNumber}</div>
                          {step.photo ? (
                            <img src={step.photo} alt={`Ponto ${step.stepNumber}`} className="w-full h-32 object-cover rounded mb-2" />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">Sem foto</div>
                          )}
                          {step.description && <p className="text-sm text-gray-600">{step.description}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Camera Modal */}
        {cameraOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold mb-2">Capturar Foto</h2>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCapture}
                  className="flex-1 gap-2"
                >
                  📷 Capturar
                </Button>
                <Button
                  onClick={handleCloseCamera}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
