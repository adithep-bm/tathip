import { useState } from "react";
import SideBar from "../components/SideBar";
import Header from "../components/Header";
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { UserFormModal } from '../components/modals/UserFormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import type { User } from "../types/user";

function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([
    // Mock data
    {
      id: "1",
      username: "officer001",
      email: "officer001@police.go.th",
      role: "admin",
      permissions: [{
        id: "1",
        name: "read",
        description: "Can manage users"
      }, {
        id: "2",
        name: "write",
        description: "Can edit user details"
      }, {
        id: "3",
        name: "delete",
        description: "Can delete users"
      }],
      status: "active"
    }
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleAddUser = (data: Partial<User>) => {
    // TODO: Implement API call
    setUsers(prev => [...prev, { ...data, id: Date.now().toString() } as User]);
    setIsAddModalOpen(false);
  };

  const handleEditUser = (data: Partial<User>) => {
    // TODO: Implement API call
    setUsers(prev => prev.map(user =>
      user.id === selectedUser?.id ? { ...user, ...data } : user
    ));
    setIsEditModalOpen(false);
  };

  const handleDeleteUser = () => {
    // TODO: Implement API call
    setUsers(prev => prev.filter(user => user.id !== selectedUser?.id));
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          < SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">จัดการผู้ใช้งาน</h1>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={20} />
                เพิ่มผู้ใช้งานใหม่
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">ผู้ใช้งาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">อีเมล</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">สิทธิ์</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-200 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          className="text-blue-400 hover:text-blue-500"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="text-purple-400 hover:text-purple-500"
                          onClick={() => {/* Open Permissions Modal */ }}
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-500"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
        mode="add"
      />

      <UserFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditUser}
        initialData={selectedUser || undefined}
        mode="edit"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        username={selectedUser?.username || ''}
      />
    </div >
  );
}

export default UserManagementPage;