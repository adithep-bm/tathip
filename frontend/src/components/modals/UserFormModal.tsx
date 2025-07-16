import { Dialog } from '@headlessui/react'
import { X } from 'lucide-react'
import type { User } from '../../types/user'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<User>) => void
  initialData?: User
  mode: 'add' | 'edit'
}

export function UserFormModal({ isOpen, onClose, onSubmit, initialData, mode }: UserFormModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-white">
              {mode === 'add' ? 'เพิ่มผู้ใช้งานใหม่' : 'แก้ไขข้อมูลผู้ใช้งาน'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            onSubmit({
              username: formData.get('username') as string,
              email: formData.get('email') as string,
              role: formData.get('role') as 'admin' | 'user' | 'viewer',
              status: formData.get('status') as 'active' | 'inactive'
            })
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input
                  type="text"
                  name="username"
                  defaultValue={initialData?.username}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={initialData?.email}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Role</label>
                <select
                  name="role"
                  defaultValue={initialData?.role}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-gray-600 text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select
                  name="status"
                  defaultValue={initialData?.status}
                  className="mt-1 block w-full rounded-md bg-slate-700 border-gray-600 text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {mode === 'add' ? 'เพิ่มผู้ใช้งาน' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}