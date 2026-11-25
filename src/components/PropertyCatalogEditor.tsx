import React, { useState } from 'react';
import { BedDouble, Coffee, Sparkles, Plus, Trash2, Check } from 'lucide-react';
import type {
  CatalogItem,
  CurrencyCode,
  Room,
  RoomType,
  ServicePackage,
} from '../types/pms';
import { formatMoney } from '../lib/format';

interface PropertyCatalogEditorProps {
  currency: CurrencyCode;
  rooms: Room[];
  catalog: CatalogItem[];
  packages: ServicePackage[];
  amenitiesList: string[];
  onUpdateRooms: (rooms: Room[]) => void;
  onUpdateCatalog: (catalog: CatalogItem[]) => void;
  onUpdatePackages: (packages: ServicePackage[]) => void;
  onAddCustomAmenity: (amenity: string) => void;
}

const DEFAULT_AMENITIES = [
  'Douche',
  'Baignoire',
  'Salle de bain privée',
  'Coffre-fort',
  'Climatisation',
  'Wi-Fi',
  'Balcon',
  'Vue mer',
  'TV Smart',
  'Bureau',
];

export const PropertyCatalogEditor: React.FC<PropertyCatalogEditorProps> = ({
  currency,
  rooms,
  catalog,
  packages,
  amenitiesList,
  onUpdateRooms,
  onUpdateCatalog,
  onUpdatePackages,
  onAddCustomAmenity,
}) => {
  const [subTab, setSubTab] = useState<'rooms' | 'menu' | 'packages'>('rooms');
  const [newAmenity, setNewAmenity] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(rooms[0]?.id || null);

  // New Menu Item
  const [mName, setMName] = useState('');
  const [mCat, setMCat] = useState<CatalogItem['category']>('bar');
  const [mPrice, setMPrice] = useState(3500);
  const [mStock, setMStock] = useState(20);

  // New Package
  const [pName, setPName] = useState('');
  const [pCat, setPCat] = useState<ServicePackage['category']>('custom');
  const [pPrice, setPPrice] = useState(10000);
  const [pUnit, setPUnit] = useState<ServicePackage['pricingUnit']>('per_stay');
  const [pDesc, setPDesc] = useState('');

  const allAmenities = Array.from(new Set([...DEFAULT_AMENITIES, ...amenitiesList]));

  const updateRoom = (roomId: string, patch: Partial<Room>) => {
    onUpdateRooms(rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)));
  };

  const toggleRoomAmenity = (room: Room, amenity: string) => {
    const current = room.amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    updateRoom(room.id, { amenities: next });
  };

  const handleAddRoom = () => {
    const nextNum = String(100 + rooms.length + 1);
    const created: Room = {
      id: `room-${Date.now()}`,
      number: nextNum,
      floor: 1,
      type: 'Standard',
      baseRate: currency === 'FCFA' ? 45000 : 95,
      maxGuests: 2,
      singleBeds: 0,
      doubleBeds: 1,
      amenities: ['Douche', 'Climatisation', 'Wi-Fi'],
      status: 'available',
    };
    onUpdateRooms([...rooms, created]);
    setEditingRoomId(created.id);
  };

  const selectedRoom = rooms.find((r) => r.id === editingRoomId) || rooms[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Sub-Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab('rooms')}
          className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'rooms' ? 'border-indigo-600 bg-white text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BedDouble className="w-4 h-4" /> Chambres, Lits & Équipements ({rooms.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('menu')}
          className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'menu' ? 'border-indigo-600 bg-white text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4" /> Carte Bar, Room Service & Minibar ({catalog.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('packages')}
          className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition ${
            subTab === 'packages' ? 'border-indigo-600 bg-white text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Formules & Packages ({packages.length})
        </button>
      </div>

      <div className="p-5">
        {/* TAB 1: ROOMS, BEDS & AMENITIES */}
        {subTab === 'rooms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rooms Table */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Liste des Chambres (cliquez pour éditer les options)
                </h4>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter une chambre
                </button>
              </div>
              <div className="border rounded-xl overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b sticky top-0">
                    <tr>
                      <th className="text-left p-2.5">N° Chambre</th>
                      <th className="text-left p-2.5">Type</th>
                      <th className="text-center p-2.5">Pers. max</th>
                      <th className="text-center p-2.5">Lits (S / D)</th>
                      <th className="text-right p-2.5">Tarif / nuit</th>
                      <th className="p-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.map((rm) => {
                      const active = selectedRoom?.id === rm.id;
                      return (
                        <tr
                          key={rm.id}
                          onClick={() => setEditingRoomId(rm.id)}
                          className={`cursor-pointer transition ${active ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-2">
                            <input
                              value={rm.number}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(rm.id, { number: e.target.value })}
                              className="w-20 px-2 py-1 border rounded font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={rm.type}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(rm.id, { type: e.target.value as RoomType })}
                              className="px-2 py-1 border rounded bg-white"
                            >
                              <option value="Standard">Standard</option>
                              <option value="Supérieure">Supérieure</option>
                              <option value="Deluxe">Deluxe</option>
                              <option value="Suite">Suite</option>
                              <option value="Familiale">Familiale</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={rm.maxGuests ?? 2}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(rm.id, { maxGuests: Number(e.target.value) })}
                              className="w-14 px-1.5 py-1 border rounded text-center bg-white"
                            />
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <input
                              type="number"
                              min={0}
                              max={8}
                              value={rm.singleBeds ?? 0}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(rm.id, { singleBeds: Number(e.target.value) })}
                              className="w-11 px-1 py-1 border rounded text-center bg-white mr-1"
                              title="Lits simples"
                            />
                            /
                            <input
                              type="number"
                              min={0}
                              max={4}
                              value={rm.doubleBeds ?? 1}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(rm.id, { doubleBeds: Number(e.target.value) })}
                              className="w-11 px-1 py-1 border rounded text-center bg-white ml-1"
                              title="Lits doubles"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={rm.baseRate}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateRoom(rm.id, { baseRate: Number(e.target.value) })}
                              className="w-24 px-2 py-1 border rounded text-right font-semibold bg-white"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (rooms.length > 1) {
                                  onUpdateRooms(rooms.filter((x) => x.id !== rm.id));
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Room Amenities & Custom Options */}
            {selectedRoom && (
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Options & Équipements — Chambre {selectedRoom.number}
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    {selectedRoom.type} • {selectedRoom.maxGuests ?? 2} pers. max • {selectedRoom.singleBeds ?? 0} lit(s) simple(s), {selectedRoom.doubleBeds ?? 1} lit(s) double(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allAmenities.map((am) => {
                    const checked = (selectedRoom.amenities || []).includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleRoomAmenity(selectedRoom, am)}
                        className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition ${
                          checked
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                        {am}
                      </button>
                    );
                  })}
                </div>

                {/* Add custom amenity */}
                <div className="pt-2 border-t border-slate-200 flex gap-2">
                  <input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Ajouter un équipement (ex: Jacuzzi, Machine café...)"
                    className="flex-1 px-3 py-1.5 border rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newAmenity.trim();
                      if (!val) return;
                      onAddCustomAmenity(val);
                      if (!(selectedRoom.amenities || []).includes(val)) {
                        toggleRoomAmenity(selectedRoom, val);
                      }
                      setNewAmenity('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BAR, ROOM SERVICE & MINIBAR MENU */}
        {subTab === 'menu' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap gap-2 items-end bg-slate-50 p-3.5 rounded-xl border">
              <div className="flex-1 min-w-[180px]">
                <label className="font-semibold text-slate-600">Nom boisson / plat / article</label>
                <input
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="Ex: Jus de Bissap, Burger Maison..."
                  className="w-full mt-1 px-3 py-1.5 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Service</label>
                <select value={mCat} onChange={(e) => setMCat(e.target.value as CatalogItem['category'])} className="w-full mt-1 px-2.5 py-1.5 border rounded-lg bg-white">
                  <option value="bar">Bar</option>
                  <option value="room_service">Room Service</option>
                  <option value="minibar">Minibar</option>
                  <option value="linen">Linge</option>
                  <option value="amenities">Accueil</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600">Tarif ({currency})</label>
                <input type="number" value={mPrice} onChange={(e) => setMPrice(Number(e.target.value))} className="w-28 mt-1 px-2.5 py-1.5 border rounded-lg bg-white" />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Stock</label>
                <input type="number" value={mStock} onChange={(e) => setMStock(Number(e.target.value))} className="w-20 mt-1 px-2.5 py-1.5 border rounded-lg bg-white" />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!mName.trim()) return;
                  const item: CatalogItem = {
                    id: `cat-${Date.now()}`,
                    name: mName.trim(),
                    category: mCat,
                    unitPrice: mPrice,
                    unitCost: Math.round(mPrice * 0.35),
                    stockQty: mStock,
                    minThreshold: 5,
                    soldCount: 0,
                  };
                  onUpdateCatalog([item, ...catalog]);
                  setMName('');
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter à la carte
              </button>
            </div>

            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="text-left p-2.5">Article</th>
                    <th className="text-left p-2.5">Catégorie</th>
                    <th className="text-right p-2.5">Prix de vente ({currency})</th>
                    <th className="text-right p-2.5">Stock</th>
                    <th className="p-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalog.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <input
                          value={item.name}
                          onChange={(e) =>
                            onUpdateCatalog(catalog.map((c) => (c.id === item.id ? { ...c, name: e.target.value } : c)))
                          }
                          className="w-full px-2 py-1 border rounded font-medium"
                        />
                      </td>
                      <td className="p-2 uppercase font-semibold text-slate-500">{item.category}</td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            onUpdateCatalog(catalog.map((c) => (c.id === item.id ? { ...c, unitPrice: Number(e.target.value) } : c)))
                          }
                          className="w-28 px-2 py-1 border rounded text-right font-semibold"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.stockQty}
                          onChange={(e) =>
                            onUpdateCatalog(catalog.map((c) => (c.id === item.id ? { ...c, stockQty: Number(e.target.value) } : c)))
                          }
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => onUpdateCatalog(catalog.filter((c) => c.id !== item.id))}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM PACKAGES (BREAKFAST, SPA, CUSTOM) */}
        {subTab === 'packages' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end bg-slate-50 p-3.5 rounded-xl border">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-600">Nom de la formule (Petit-déj, Spa, Sur-mesure)</label>
                <input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="Ex: Pack Romantique Champagne + Spa"
                  className="w-full mt-1 px-3 py-1.5 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Type</label>
                <select value={pCat} onChange={(e) => setPCat(e.target.value as ServicePackage['category'])} className="w-full mt-1 px-2.5 py-1.5 border rounded-lg bg-white">
                  <option value="breakfast">Petit-déjeuner</option>
                  <option value="spa">Spa & Bien-être</option>
                  <option value="dining">Restauration</option>
                  <option value="transport">Transport</option>
                  <option value="custom">Formule personnalisée</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600">Tarif ({currency})</label>
                <input type="number" value={pPrice} onChange={(e) => setPPrice(Number(e.target.value))} className="w-full mt-1 px-2.5 py-1.5 border rounded-lg bg-white" />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Facturation</label>
                <select value={pUnit} onChange={(e) => setPUnit(e.target.value as ServicePackage['pricingUnit'])} className="w-full mt-1 px-2 py-1.5 border rounded-lg bg-white">
                  <option value="per_person_per_night">Par pers. / nuit</option>
                  <option value="per_night">Par nuit</option>
                  <option value="per_stay">Par séjour</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <input
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Description courte de la formule..."
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!pName.trim()) return;
                  const created: ServicePackage = {
                    id: `pkg-${Date.now()}`,
                    name: pName.trim(),
                    category: pCat,
                    price: pPrice,
                    pricingUnit: pUnit,
                    description: pDesc.trim(),
                    active: true,
                  };
                  onUpdatePackages([created, ...packages]);
                  setPName('');
                  setPDesc('');
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Créer formule
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4 rounded-xl border bg-white flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{pkg.name}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">
                        {pkg.category}
                      </span>
                    </div>
                    <p className="text-slate-500">{pkg.description || 'Formule personnalisée'}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-bold text-emerald-700">
                        {formatMoney(pkg.price, currency)}
                      </span>
                      <span className="text-slate-400">
                        ({pkg.pricingUnit === 'per_person_per_night' ? 'par pers./nuit' : pkg.pricingUnit === 'per_night' ? 'par nuit' : 'par séjour'})
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pkg.active}
                        onChange={(e) =>
                          onUpdatePackages(packages.map((x) => (x.id === pkg.id ? { ...x, active: e.target.checked } : x)))
                        }
                      />
                      <span className="font-semibold">Active</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdatePackages(packages.filter((x) => x.id !== pkg.id))}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
