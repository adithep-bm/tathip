import { Dialog } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  username: string
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, username }: DeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-xl">
          <div className="flex items-center space-x-3 text-red-400 mb-4">
            <AlertTriangle size={24} />
            <Dialog.Title className="text-lg font-medium">ยืนยันการลบผู้ใช้งาน</Dialog.Title>
          </div>

          <p className="text-gray-300">
            คุณต้องการลบผู้ใช้งาน <span className="font-medium text-white">{username}</span> ใช่หรือไม่?
          </p>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              ยืนยันการลบ
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}