import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userPropertyService } from '../services/airtable/userPropertyService';
import { authorizationService } from '../services/authorizationService';
import { AuthService } from '../services/auth/authService';

interface PropertyAccessProps {
  propertyId: string;
}

interface UserAccess {
  userId: string;
  email: string;
  role: 'owner' | 'manager' | 'viewer';
}

export const PropertyAccess: React.FC<PropertyAccessProps> = ({ propertyId }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager' | 'viewer'>('viewer');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadCurrentUserRole();
  }, [propertyId]);

  const loadUsers = async () => {
    try {
      const propertyUsers = await userPropertyService.getPropertyUsers(propertyId);
      
      // Récupérer les informations des utilisateurs depuis la table Users
      const userDetails = await Promise.all(
        propertyUsers.map(async (pu) => {
          try {
            const records = await AuthService.getUsers({
              filterByFormula: `RECORD_ID() = '${pu.userId}'`,
              fields: ['email']
            })
              .firstPage();
            
            return {
              userId: pu.userId,
              email: records[0]?.fields.email || 'Unknown',
              role: pu.role
            };
          } catch (error) {
            console.error(`Failed to fetch user details for ${pu.userId}:`, error);
            return {
              userId: pu.userId,
              email: 'Unknown',
              role: pu.role
            };
          }
        })
      );

      setUsers(userDetails);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    }
  };

  const loadCurrentUserRole = async () => {
    if (user) {
      const role = await authorizationService.getUserRole(user.id, propertyId);
      setCurrentUserRole(role);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    try {
      // Rechercher l'utilisateur par email dans la table Users
      const records = await AuthService.getUsers({
        filterByFormula: `{email} = '${newUserEmail}'`,
        fields: ['email']
      })
        .firstPage();

      if (records.length === 0) {
        setError("Cet utilisateur n'existe pas");
        return;
      }

      const targetUserId = records[0].id;
      
      await authorizationService.addPropertyAccess(
        targetUserId,
        propertyId,
        newUserRole,
        user.id
      );
      
      setNewUserEmail('');
      loadUsers();
    } catch (error) {
      console.error('Failed to add user:', error);
      setError("Erreur lors de l'ajout de l'utilisateur");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'manager' | 'viewer') => {
    try {
      await authorizationService.updatePropertyRole(userId, propertyId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      setError("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await authorizationService.removePropertyAccess(userId, propertyId);
      loadUsers();
    } catch (error) {
      console.error('Failed to remove user:', error);
      setError("Erreur lors de la suppression de l'utilisateur");
    }
  };

  if (!user || currentUserRole !== 'owner') {
    return null;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gérer les accès</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Formulaire d'ajout d'utilisateur */}
      <form onSubmit={handleAddUser} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Email de l'utilisateur"
            className="flex-1 p-2 border rounded"
          />
          <select
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as 'manager' | 'viewer')}
            className="p-2 border rounded"
          >
            <option value="viewer">Lecteur</option>
            <option value="manager">Gestionnaire</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ajouter
          </button>
        </div>
      </form>

      {/* Liste des utilisateurs */}
      <div className="space-y-2">
        {users.map((userAccess) => (
          <div key={userAccess.userId} className="flex items-center justify-between p-2 border rounded">
            <span>{userAccess.email}</span>
            <div className="flex items-center gap-2">
              <select
                value={userAccess.role}
                onChange={(e) => handleUpdateRole(userAccess.userId, e.target.value as 'owner' | 'manager' | 'viewer')}
                className="p-1 border rounded"
                disabled={userAccess.role === 'owner'}
              >
                <option value="owner">Propriétaire</option>
                <option value="manager">Gestionnaire</option>
                <option value="viewer">Lecteur</option>
              </select>
              {userAccess.role !== 'owner' && (
                <button
                  onClick={() => handleRemoveUser(userAccess.userId)}
                  className="p-1 text-red-500 hover:text-red-600"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
