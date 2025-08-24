import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../../Componente/NavBar/NavBar';
import styles from './Ambalare.module.css';

const API_URL = "http://localhost:3001/api";

const Ambalare = () => {
  const [materiale, setMateriale] = useState([]);
  const [fermentatoare, setFermentatoare] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMaterial, setNewMaterial] = useState({
    denumire: '',
    cantitate: '',
    unitate: '',
    producator: '',
    codProdus: '',
    lot: '',
    tip: '',
    subcategorie: '',
  });
  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFermentator, setSelectedFermentator] = useState(null);
  const [packagingType, setPackagingType] = useState('');
  const [bottleSize, setBottleSize] = useState('');
  const [boxType, setBoxType] = useState('');
  const [kegSize, setKegSize] = useState('');
  const [ambalareInsuficiente, setAmbalareInsuficiente] = useState([]);
  const [supplementCantitati, setSupplementCantitati] = useState({});
  const [cantitateDeAmbalat, setCantitateDeAmbalat] = useState(''); // Cantitatea de ambalat (parțială)
  
  // Data loading functions
  const loadMateriale = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/materiale-ambalare`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log('Materiale încărcate:', data);
      setMateriale(data);
    } catch (error) {
      setError(`Eroare la încărcarea materialelor: ${error.message}`);
    }
  }, []);

  const loadFermentatoare = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/fermentatoare`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setFermentatoare(data.filter(f => f.ocupat && f.cantitate > 0));
    } catch (error) {
      setError(`Eroare la încărcarea fermentatoarelor: ${error.message}`);
    }
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplementChange = (id, value) => {
    setSupplementCantitati(prev => ({
      ...prev,
      [id]: value ? Number(value) : '',
    }));
  };

  const handleSupplementMaterial = async (id) => {
    const cantitateSuplimentara = supplementCantitati[id];
    if (!cantitateSuplimentara || cantitateSuplimentara <= 0) {
      setError('Introduceți o cantitate validă pentru suplimentare!');
      return;
    }

    const material = materiale.find(m => m.id === parseInt(id));
    if (!material) {
      setError('Materialul nu a fost găsit!');
      return;
    }

    try {
      const newCantitate = material.cantitate + cantitateSuplimentara;
      const res = await fetch(`${API_URL}/materiale-ambalare/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...material, cantitate: newCantitate }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Eroare la actualizare: ${res.status} - ${errorText || 'Resursa nu a fost găsită'}`);
      }
      const updatedMaterial = await res.json();
      setMateriale(prev => prev.map(m => m.id === parseInt(id) ? { ...m, ...updatedMaterial } : m));
      setSupplementCantitati(prev => ({ ...prev, [id]: '' }));
      setError('');
    } catch (error) {
      setError(`Eroare la suplimentarea materialului: ${error.message}`);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterial.denumire || !newMaterial.cantitate || !newMaterial.unitate || !newMaterial.tip) {
      setError('Completați toate câmpurile obligatorii: denumire, cantitate, unitate, tip');
      return;
    }

    try {
      const materialToSend = {
        ...newMaterial,
        cantitate: Number(newMaterial.cantitate),
      };

      const res = await fetch(`${API_URL}/materiale-ambalare/${isEditing ? editId : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialToSend),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Eroare la ${isEditing ? 'actualizare' : 'adăugare'} material: ${res.status} - ${errorText || 'Resursa nu a fost găsită'}`);
      }
      const updatedMaterial = await res.json();
      setMateriale(prev => isEditing
        ? prev.map(m => m.id === parseInt(editId) ? { ...m, ...updatedMaterial } : m)
        : [...prev, updatedMaterial]
      );
      setIsEditing(false);
      setEditId(null);
      setNewMaterial({
        denumire: '',
        cantitate: '',
        unitate: '',
        producator: '',
        codProdus: '',
        lot: '',
        tip: '',
        subcategorie: '',
      });
      setError('');
    } catch (error) {
      console.error('Detalii eroare:', error);
      setError(`Eroare la salvarea materialului: ${error.message}`);
    }
  };

  const handleEdit = (material) => {
    setNewMaterial({
      denumire: material.denumire,
      cantitate: material.cantitate,
      unitate: material.unitate,
      producator: material.producator || '',
      codProdus: material.codProdus || '',
      lot: material.lot || '',
      tip: material.tip || '',
      subcategorie: material.subcategorie || '',
    });
    setEditId(material.id);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setNewMaterial({
      denumire: '',
      cantitate: '',
      unitate: '',
      producator: '',
      codProdus: '',
      lot: '',
      tip: '',
      subcategorie: '',
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/materiale-ambalare/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Eroare la ștergerea materialului');
      setMateriale(prev => prev.filter(m => m.id !== parseInt(id)));
    } catch (error) {
      setError(`Eroare la ștergerea materialului: ${error.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/materiale-ambalare/export`);
      if (!res.ok) throw new Error('Eroare la exportarea materialelor');
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'materiale-ambalare.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(`Eroare la exportarea materialelor: ${error.message}`);
    }
  };

  // Stock verification logic
  const denumireMap = {
    'cutii 6 sticle': 'cutii 6 sticle',
    'cutii 12 sticle': 'cutii 12 sticle',
    'cutii 24 sticle': 'cutii 24 sticle',
    'sticle 0.33l': 'sticle 0.33l',
    'keg 10l': 'keg 10l',
    'keg 20l': 'keg 20l',
    'keg 30l': 'keg 30l',
    'keg 40l': 'keg 40l',
    'keg 50l': 'keg 50l',
    'capace': 'capace',
    'etichete': 'etichete',
  };

  const normalizeString = (str) => {
    const normalized = str.trim().toLowerCase();
    return denumireMap[normalized] || normalized;
  };

  const verificaStocAmbalare = (cantitateBere, packagingType, bottleSize, boxType, kegSize) => {
    let ambalareNecesare = [];
    console.log('Verificare stoc pentru:', { cantitateBere, packagingType, bottleSize, boxType, kegSize });
    console.log('Materiale disponibile:', materiale);

    if (packagingType === "sticle") {
      const bottleCapacity = bottleSize === "0.33l" ? 0.33 : 0.5;
      const bottlesPerBox = boxType === "6 sticle" ? 6 : boxType === "12 sticle" ? 12 : 24;
      const numBottles = Math.ceil(cantitateBere / bottleCapacity);
      const numBoxes = Math.ceil(numBottles / bottlesPerBox);
      ambalareNecesare = [
        { denumire: `Sticle ${bottleSize}`, cantitate: numBottles, unitate: "buc", tip: "sticle" },
        { denumire: "Capace", cantitate: numBottles, unitate: "buc", tip: "capace" },
        { denumire: "Etichete", cantitate: numBottles, unitate: "buc", tip: "etichete" },
        { denumire: `Cutii ${boxType}`, cantitate: numBoxes, unitate: "buc", tip: "cutii" },
      ];
    } else if (packagingType === "keguri") {
      const kegSizes = [
        { denumire: "Keg 10l", capacitate: 10 },
        { denumire: "Keg 20l", capacitate: 20 },
        { denumire: "Keg 30l", capacitate: 30 },
        { denumire: "Keg 40l", capacitate: 40 },
        { denumire: "Keg 50l", capacitate: 50 },
      ];
      
      // Calculăm numărul de keg-uri necesare pentru cantitatea specificată
      const selectedKeg = kegSizes.find(k => k.denumire === kegSize) || kegSizes[kegSizes.length - 1];
      const numKegs = Math.ceil(cantitateBere / selectedKeg.capacitate);
      
      ambalareNecesare = [
        { 
          denumire: selectedKeg.denumire, 
          cantitate: numKegs, 
          unitate: "buc", 
          tip: "keg" 
        }
      ];
    }

    const insuficiente = ambalareNecesare
      .map(amb => {
        const stoc = materiale.find(m => 
          normalizeString(m.denumire) === normalizeString(amb.denumire) && 
          normalizeString(m.unitate) === normalizeString(amb.unitate)
        );
        console.log(`Verificare ${amb.denumire} (${amb.unitate}):`, { stoc, cantitateNecesara: amb.cantitate });
        if (!stoc || stoc.cantitate < amb.cantitate) {
          return {
            denumire: amb.denumire,
            cantitateNecesara: amb.cantitate,
            cantitateDisponibila: stoc ? stoc.cantitate : 0,
            unitate: amb.unitate,
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log('Materiale insuficiente:', insuficiente);
    return { ambalareNecesare, insuficiente };
  };

  const handleAmbalare = async () => {
    if (!selectedFermentator || !packagingType || 
        (packagingType === "sticle" && (!bottleSize || !boxType)) || 
        (packagingType === "keguri" && !kegSize)) {
      setError('Selectați un fermentator, tipul de ambalare și toate detaliile necesare!');
      return;
    }

    // Validare cantitate de ambalat
    const cantitateDeAmbalatNum = parseFloat(cantitateDeAmbalat);
    if (isNaN(cantitateDeAmbalatNum) || cantitateDeAmbalatNum <= 0) {
      setError('Introduceți o cantitate validă de ambalat!');
      return;
    }
    
    if (cantitateDeAmbalatNum > selectedFermentator.cantitate) {
      setError('Cantitatea de ambalat nu poate depăși cantitatea disponibilă în fermentator!');
      return;
    }

    const { ambalareNecesare, insuficiente } = verificaStocAmbalare(
      cantitateDeAmbalatNum, 
      packagingType, 
      bottleSize, 
      boxType, 
      kegSize
    );
    setAmbalareInsuficiente(insuficiente);

    if (insuficiente.length > 0) {
      setError(`⚠️ Materiale insuficiente pentru ${cantitateDeAmbalatNum}L:\n` +
        insuficiente.map(amb => `${amb.denumire}: Necesare ${amb.cantitateNecesara} ${amb.unitate}, Disponibile ${amb.cantitateDisponibila} ${amb.unitate}`).join('\n')
      );
      return;
    }

    try {
      // Update materials stock
      for (const amb of ambalareNecesare) {
        const stoc = materiale.find(m => 
          normalizeString(m.denumire) === normalizeString(amb.denumire) && 
          normalizeString(m.unitate) === normalizeString(amb.unitate)
        );
        if (stoc) {
          const newCantitate = stoc.cantitate - amb.cantitate;
          await fetch(`${API_URL}/materiale-ambalare/${stoc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...stoc, cantitate: newCantitate }),
          });
        }
      }

      // Calculate remaining quantity in fermenter
      const remainingQuantity = selectedFermentator.cantitate - cantitateDeAmbalatNum;
      
      // Update fermentator status - only mark as empty if all beer is packaged
      const updatedFermentator = {
        ...selectedFermentator,
        ocupat: remainingQuantity > 0,
        cantitate: remainingQuantity,
      };
      
      await fetch(`${API_URL}/fermentatoare/${selectedFermentator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFermentator),
      });

      // Create packaging lot record
      const lotData = {
        fermentatorId: selectedFermentator.id,
        reteta: selectedFermentator.reteta,
        cantitate: cantitateDeAmbalatNum,
        unitate: "litri",
        dataInceput: selectedFermentator.dataInceput,
        dataAmbalare: new Date().toISOString(),
        packagingType,
        bottleSize: packagingType === "sticle" ? bottleSize : null,
        boxType: packagingType === "sticle" ? boxType : null,
        kegSize: packagingType === "keguri" ? kegSize : null,
        materialsUsed: ambalareNecesare.map(m => ({ 
          denumire: m.denumire, 
          cantitate: m.cantitate, 
          unitate: m.unitate 
        })),
      };
      
      const lotResponse = await fetch(`${API_URL}/loturi-ambalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lotData),
      });

      if (!lotResponse.ok) {
        throw new Error('Eroare la salvarea lotului');
      }

      // Update state
      setMateriale(prev => prev.map(m => {
        const consum = ambalareNecesare.find(a => 
          normalizeString(a.denumire) === normalizeString(m.denumire) && 
          normalizeString(a.unitate) === normalizeString(m.unitate)
        );
        return consum ? { ...m, cantitate: m.cantitate - consum.cantitate } : m;
      }));
      
      // Update fermentatoare list - remove if empty, update if partial
      setFermentatoare(prev => {
        if (remainingQuantity <= 0) {
          return prev.filter(f => f.id !== selectedFermentator.id);
        } else {
          return prev.map(f => 
            f.id === selectedFermentator.id 
              ? { ...f, cantitate: remainingQuantity } 
              : f
          );
        }
      });
      
      setSelectedFermentator(remainingQuantity > 0 ? updatedFermentator : null);
      setCantitateDeAmbalat('');
      setPackagingType('');
      setBottleSize('');
      setBoxType('');
      setKegSize('');
      setAmbalareInsuficiente([]);
      setError(`✅ Ambalare realizată cu succes! ${cantitateDeAmbalatNum}L au fost ambalate.${remainingQuantity > 0 ? ` Au rămas ${remainingQuantity}L în fermentator.` : ''}`);

    } catch (error) {
      setError(`Eroare la ambalare: ${error.message}`);
    }
  };

  useEffect(() => {
    Promise.all([loadMateriale(), loadFermentatoare()]).then(() => setLoading(false));
  }, [loadMateriale, loadFermentatoare]);

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        {error && (
          <div className={styles.modal}>
            <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
            <button onClick={() => setError('')}>Închide</button>
          </div>
        )}

        <h1 className={styles.titlu}>Materiale de Ambalare</h1>
        <div className={styles.fermentatorStatus}>
          <h2>Selecție Fermentator pentru Ambalare</h2>
          <div className={styles.fermentatoareGrid}>
            {fermentatoare.length === 0 ? (
              <p>Nu există fermentatoare ocupate</p>
            ) : (
              fermentatoare.map((fermentator) => (
                <div
                  key={fermentator.id}
                  className={`${styles.fermentatorCard} ${fermentator.ocupat ? styles.ocupat : ''}`}
                  onClick={() => {
                    setSelectedFermentator(fermentator);
                    setCantitateDeAmbalat(fermentator.cantitate); // Setează cantitatea maximă implicit
                  }}
                >
                  <div className={styles.fermentatorCardOverlay}>
                    <h3>{fermentator.nume}</h3>
                    <p>Reteta: {fermentator.reteta}</p>
                    <p>Cantitate: {fermentator.cantitate}L</p>
                    <p>Data: {new Date(fermentator.dataInceput).toLocaleDateString()}</p>
                    {selectedFermentator?.id === fermentator.id && (
                      <>
                        <div className={styles.cantitateInput}>
                          <label>Cantitate de ambalat (L):</label>
                          <input
                            type="number"
                            className={styles.input}
                            value={cantitateDeAmbalat}
                            onChange={(e) => setCantitateDeAmbalat(e.target.value)}
                            min="0"
                            max={fermentator.cantitate}
                            step="0.1"
                          />
                        </div>
                        <select
                          className={styles.input}
                          value={packagingType}
                          onChange={(e) => {
                            setPackagingType(e.target.value);
                            setBottleSize('');
                            setBoxType('');
                            setKegSize('');
                          }}
                        >
                          <option value="">Selectați tipul de ambalare</option>
                          <option value="sticle">Sticle</option>
                          <option value="keguri">Keguri</option>
                        </select>
                        {packagingType === "sticle" && (
                          <>
                            <select
                              className={styles.input}
                              value={bottleSize}
                              onChange={(e) => setBottleSize(e.target.value)}
                            >
                              <option value="">Selectați dimensiune sticlă</option>
                              <option value="0.33l">0.33l</option>
                              <option value="0.5l">0.5l</option>
                            </select>
                            <select
                              className={styles.input}
                              value={boxType}
                              onChange={(e) => setBoxType(e.target.value)}
                            >
                              <option value="">Selectați tip cutie</option>
                              <option value="6 sticle">Cutii 6 sticle</option>
                              <option value="12 sticle">Cutii 12 sticle</option>
                              <option value="24 sticle">Cutii 24 sticle</option>
                            </select>
                          </>
                        )}
                        {packagingType === "keguri" && (
                          <select
                            className={styles.input}
                            value={kegSize}
                            onChange={(e) => setKegSize(e.target.value)}
                          >
                            <option value="">Selectați dimensiune keg</option>
                            <option value="Keg 10l">Keg 10l</option>
                            <option value="Keg 20l">Keg 20l</option>
                            <option value="Keg 30l">Keg 30l</option>
                            <option value="Keg 40l">Keg 40l</option>
                            <option value="Keg 50l">Keg 50l</option>
                          </select>
                        )}
                        {packagingType && 
                          ((packagingType === "sticle" && bottleSize && boxType) || 
                           (packagingType === "keguri" && kegSize)) && (
                          <button className={styles.button} onClick={handleAmbalare}>
                            Ambalare
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {ambalareInsuficiente.length > 0 && (
            <div className={styles.formRow}>
              <ul>
                {ambalareInsuficiente.map((amb, index) => (
                  <li key={index} className={styles.cell}>
                    {amb.denumire}: Necesare {amb.cantitateNecesara} {amb.unitate}, Disponibile {amb.cantitateDisponibila} {amb.unitate}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Restul codului rămâne neschimbat */}
        <div className={styles.toolbar}>
          <div>
            <button className={styles.buttonRefresh} onClick={() => Promise.all([loadMateriale(), loadFermentatoare()])}>
              Reîmprospătează
            </button>
            <button className={styles.buttonExport} onClick={handleExport}>
              Exportă CSV
            </button>
          </div>
        </div>

        <div className={styles.formular}>
          <h2>{isEditing ? 'Editează Material' : 'Adaugă Material'}</h2>
          <form onSubmit={handleAddMaterial}>
            <div className={styles.formRow}>
              <input
                type="text"
                name="denumire"
                className={styles.input}
                placeholder="Denumire"
                value={newMaterial.denumire}
                onChange={handleInputChange}
              />
              <input
                type="number"
                name="cantitate"
                className={styles.input}
                placeholder="Cantitate"
                value={newMaterial.cantitate}
                onChange={handleInputChange}
                step="0.01"
              />
              <input
                type="text"
                name="unitate"
                className={styles.input}
                placeholder="Unitate"
                value={newMaterial.unitate}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="producator"
                className={styles.input}
                placeholder="Producător"
                value={newMaterial.producator}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="codProdus"
                className={styles.input}
                placeholder="Cod Produs"
                value={newMaterial.codProdus}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="lot"
                className={styles.input}
                placeholder="Lot"
                value={newMaterial.lot}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="tip"
                className={styles.input}
                placeholder="Tip"
                value={newMaterial.tip}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="subcategorie"
                className={styles.input}
                placeholder="Subcategorie"
                value={newMaterial.subcategorie}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.formButtons}>
              <button type="submit" className={isEditing ? styles.buttonUpdate : styles.button}>
                {isEditing ? 'Actualizează' : 'Adaugă'}
              </button>
              {isEditing && (
                <button type="button" className={styles.buttonCancel} onClick={handleCancelEdit}>
                  Anulează
                </button>
              )}
            </div>
          </form>
        </div>

        <div className={styles.tabelContainer}>
          {loading ? (
            <div className={styles.loading}>Se încarcă...</div>
          ) : materiale.length === 0 ? (
            <div className={styles.noResults}>Niciun material găsit</div>
          ) : (
            <table className={styles.tabel}>
              <thead>
                <tr>
                  <th className={styles.headerCell}>ID</th>
                  <th className={styles.headerCell}>Denumire</th>
                  <th className={styles.headerCell}>Cantitate</th>
                  <th className={styles.headerCell}>Unitate</th>
                  <th className={styles.headerCell}>Producător</th>
                  <th className={styles.headerCell}>Cod Produs</th>
                  <th className={styles.headerCell}>Lot</th>
                  <th className={styles.headerCell}>Tip</th>
                  <th className={styles.headerCell}>Subcategorie</th>
                  <th className={styles.headerCell}>Supliment</th>
                  <th className={styles.headerCell}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {materiale.map(material => (
                  <tr key={material.id} className={styles.row}>
                    <td className={styles.cell}>{material.id}</td>
                    <td className={styles.cell}>{material.denumire}</td>
                    <td className={styles.cell}>{material.cantitate}</td>
                    <td className={styles.cell}>{material.unitate}</td>
                    <td className={styles.cell}>{material.producator || '-'}</td>
                    <td className={styles.cell}>{material.codProdus || '-'}</td>
                    <td className={styles.cell}>{material.lot || '-'}</td>
                    <td className={styles.cell}>{material.tip || '-'}</td>
                    <td className={styles.cell}>{material.subcategorie || '-'}</td>
                    <td className={styles.cell}>
                      <input
                        type="number"
                        className={styles.input}
                        placeholder="Cantitate"
                        value={supplementCantitati[material.id] || ''}
                        onChange={(e) => handleSupplementChange(material.id, e.target.value)}
                        step="0.01"
                      />
                      <button
                        className={styles.buttonAdauga}
                        onClick={() => handleSupplementMaterial(material.id)}
                      >
                        + Adaugă
                      </button>
                    </td>
                    <td className={styles.cellActions}>
                      <button
                        className={styles.buttonEdit}
                        onClick={() => handleEdit(material)}
                      >
                        Editează
                      </button>
                      <button
                        className={styles.buttonDelete}
                        onClick={() => handleDelete(material.id)}
                      >
                        - Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Ambalare;