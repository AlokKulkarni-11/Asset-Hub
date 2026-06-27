import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, UserPlus, Loader2 } from 'lucide-react';
import { getFamilyMembers, addFamilyMember } from '../api/family.api';

export default function Family() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relationType, setRelationType] = useState('SELF');
  
  const queryClient = useQueryClient();

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: getFamilyMembers,
  });

  const mutation = useMutation({
    mutationFn: addFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setShowAddForm(false);
      setName('');
      setRelationType('SELF');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    mutation.mutate({ name, relationType });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading">Family Management</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card p-6 border-gold-400/30">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gold-400" />
            New Family Member
          </h2>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Name</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="glass-input" 
                placeholder="E.g. Priya"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Relationship</label>
              <select 
                value={relationType} 
                onChange={(e) => setRelationType(e.target.value)} 
                className="glass-input bg-navy-900"
              >
                <option value="SELF">Self</option>
                <option value="SPOUSE">Spouse</option>
                <option value="CHILD">Child</option>
                <option value="PARENT">Parent</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={mutation.isPending || !name} 
              className="btn-primary"
            >
              {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="text-text-muted">Loading family members...</div>
        ) : familyMembers?.length === 0 ? (
          <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">No Family Members</h3>
            <p className="text-text-secondary">Add yourself and your family members to start tracking assets.</p>
          </div>
        ) : (
          familyMembers?.map((member) => (
            <div key={member.id} className="glass-card p-6 flex items-center justify-between hover:border-gold-400/20 transition-colors">
              <div>
                <h3 className="font-medium text-lg">{member.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-navy-900 border border-white/10 text-gold-300 inline-block mt-2">
                  {member.relationType}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted block">ID</span>
                <span className="text-xl font-medium font-dmsans text-text-secondary">#{member.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
