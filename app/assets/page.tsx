'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Laptop, Plus } from '@/components/ui/Icon';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Asset Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetCode, setAssetCode] = useState(`AST-LAP-${Date.now().toString().slice(-4)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [serialNumber, setSerialNumber] = useState('');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/assets');
      setAssets(res.assets || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load company assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/assets', {
        method: 'POST',
        body: JSON.stringify({
          asset_code: assetCode,
          name,
          category,
          serial_number: serialNumber,
        }),
      });
      setToastMessage(res.message || 'Asset registered!');
      setIsModalOpen(false);
      setName('');
      setSerialNumber('');
      loadAssets();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to register asset');
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="Company Asset Registry & Inventory"
        description="Laptops, smartphones, monitors, and peripherals assigned to employees throughout their tenure."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading company assets...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">No company assets registered.</div>
        ) : (
          <TablePrimitive
            headers={['Asset Tag', 'Asset Name', 'Category', 'Serial Number', 'Assigned To', 'Condition', 'Status']}
            rows={assets.map((a) => [
              <span key="code" className="font-mono text-xs font-black text-[#0f365e]">{a.asset_code}</span>,
              <span key="name" className="font-extrabold text-slate-900 text-xs">{a.name}</span>,
              <span key="cat" className="capitalize text-xs text-slate-700 font-bold px-2 py-0.5 bg-slate-100 rounded border border-slate-200">{a.category}</span>,
              <span key="sn" className="font-mono text-xs text-slate-500">{a.serial_number || 'N/A'}</span>,
              <span key="emp" className="text-xs font-bold text-slate-800">{a.assigned_employee?.name || 'Unassigned'}</span>,
              <span key="cond" className="capitalize text-xs font-bold text-emerald-700">{a.condition}</span>,
              <Badge key="status" variant={a.status === 'assigned' ? 'green' : 'neutral'}>
                {a.status.toUpperCase()}
              </Badge>,
            ])}
          />
        )}
      </div>

      {/* REGISTER ASSET MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Company Asset">
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Asset Tag / Code</label>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Asset Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Laptop">Laptop / Workstation</option>
                <option value="Phone">Smart Phone</option>
                <option value="Monitor">External Monitor</option>
                <option value="Headset">Noise-Cancelling Headset</option>
                <option value="Peripheral">Peripheral / Dock</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Asset Model Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Dell XPS 15 9530 / MacBook Pro M3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="e.g. S/N C02GX001MD6M"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Register Asset
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
