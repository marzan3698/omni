import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeGroupApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Users, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeGroup {
  id: number;
  name: string;
  description: string;
  _count?: {
    members: number;
    campaigns: number;
  };
  members?: Array<{
    employee: {
      id: number;
      user: {
        id: string;
        email: string;
        name: string | null;
      };
    };
  }>;
}

interface GroupSelectorProps {
  companyId: number;
  selectedGroupIds: number[];
  onSelectionChange: (groupIds: number[]) => void;
}

export function GroupSelector({
  companyId,
  selectedGroupIds,
  onSelectionChange,
}: GroupSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch employee groups
  const { data: groupsResponse, isLoading } = useQuery({
    queryKey: ['employee-groups-selector', companyId, debouncedSearchTerm],
    queryFn: async () => {
      const response = await employeeGroupApi.getAll(companyId);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch employee groups');
      }
      const groups = (response.data.data || []) as EmployeeGroup[];
      
      // Filter by search term if provided
      if (debouncedSearchTerm.trim()) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        return groups.filter((group) => {
          const name = group.name || '';
          const description = group.description || '';
          return (
            name.toLowerCase().includes(searchLower) ||
            description.toLowerCase().includes(searchLower)
          );
        });
      }
      
      return groups;
    },
    enabled: !!companyId,
  });

  const groups = groupsResponse || [];
  
  // Memoize selected groups for display
  const selectedGroups = useMemo(() => {
    return groups.filter((group) => selectedGroupIds.includes(group.id));
  }, [groups, selectedGroupIds]);

  const handleToggleGroup = (groupId: number) => {
    if (selectedGroupIds.includes(groupId)) {
      onSelectionChange(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      onSelectionChange([...selectedGroupIds, groupId]);
    }
  };

  const handleRemoveGroup = (groupId: number) => {
    onSelectionChange(selectedGroupIds.filter((id) => id !== groupId));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search groups by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Groups */}
      {selectedGroupIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">
            Selected Groups ({selectedGroupIds.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md text-sm"
              >
                <Users className="w-3 h-3" />
                <span>{group.name}</span>
                {group._count?.members !== undefined && (
                  <span className="text-xs bg-indigo-200 px-1.5 py-0.5 rounded">
                    {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="ml-1 hover:text-indigo-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {(debouncedSearchTerm.trim() || groups.length > 0) && (
        <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {debouncedSearchTerm.trim()
                ? `No groups found for "${debouncedSearchTerm}"`
                : 'No employee groups available'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleToggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-indigo-50'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {group.name}
                        </div>
                        {group.description && (
                          <div className="text-xs text-slate-500 truncate mt-1">
                            {group.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {group._count?.members !== undefined && (
                            <span className="text-xs text-slate-400">
                              {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                            </span>
                          )}
                          {group._count?.campaigns !== undefined && group._count.campaigns > 0 && (
                            <>
                              {group._count.members !== undefined && (
                                <span className="text-xs text-slate-300">•</span>
                              )}
                              <span className="text-xs text-slate-400">
                                {group._count.campaigns} campaign{group._count.campaigns !== 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!debouncedSearchTerm.trim() && selectedGroupIds.length === 0 && groups.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No employee groups available. Create groups to assign them to campaigns.
        </div>
      )}
    </div>
  );
}

