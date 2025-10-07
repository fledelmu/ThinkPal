import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    try {
      await createUser(newUsername, newPassword, newRole);
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleUpdate = async (userId) => {
    const updatedUsername = prompt('Enter new username:');
    const updatedRole = prompt('Enter new role (user/admin):');
    if (!updatedUsername || !updatedRole) return;
    try {
      await updateUser(userId, updatedUsername, updatedRole);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="mt-5 ml-32 w-[80vw] h-[95vh] text-left p-4 border border-gray-300">
      <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="mr-2 p-1 border border-gray-400 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mr-2 p-1 border border-gray-400 rounded"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="mr-2 p-1 border border-gray-400 rounded"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleCreate}
          className="px-2 py-1 bg-blue-500 text-white rounded"
        >
          Create
        </button>
      </div>

      <table border="1" cellPadding="5" className="w-full h-[85%] overflow-auto">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.user_id}</td>
              <td>{u.username}</td> 
              <td>{u.role}</td>
              <td>
                <button onClick={() => handleUpdate(u.user_id)} className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                <button onClick={() => handleDelete(u.user_id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
