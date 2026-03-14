import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeGroupApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, X, Users, Check } from 'lucide-react';
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500/50" />
        <Input
          type="text"
          placeholder="Search groups by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900/50 border-amber-500/20 text-amber-100 placeholder:text-amber-900/40"
        />
      </div>

      {/* Selected Groups */}
      {selectedGroupIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest">
            Selected Groups ({selectedGroupIds.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-sm animate-game-score-pop"
              >
                <Users className="w-3 h-3 text-blue-500/50" />
                <span className="font-medium">{group.name}</span>
                {group._count?.members !== undefined && (
                  <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">
                    {group._count.members}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="ml-1 hover:text-blue-100 transition-colors"
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
        <div className="border border-amber-500/20 bg-slate-900/50 rounded-lg max-h-64 overflow-y-auto backdrop-blur-sm shadow-2xl">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-amber-200/40 animate-pulse">
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center text-sm text-amber-200/40 italic">
              {debouncedSearchTerm.trim()
                ? `No groups found for "${debouncedSearchTerm}"`
                : 'No employee groups available'}
            </div>
          ) : (
            <div className="divide-y divide-amber-500/5">
              {groups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleToggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 hover:bg-amber-500/10 transition-colors group',
                      isSelected && 'bg-amber-500/5'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div
                        className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center transition-all flex-shrink-0',
                          isSelected
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-amber-500/20 bg-slate-900 group-hover:border-amber-500/40'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-slate-900 font-bold" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-100 truncate">
                          {group.name}
                        </div>
                        {group.description && (
                          <div className="text-[10px] text-amber-200/40 truncate mt-0.5 leading-relaxed">
                            {group.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {group._count?.members !== undefined && (
                            <span className="text-[10px] text-amber-500/40 uppercase tracking-widest font-bold">
                              {group._count.members} Members
                            </span>
                          )}
                          {group._count?.campaigns !== undefined && group._count.campaigns > 0 && (
                            <>
                              <span className="text-amber-500/20">•</span>
                              <span className="text-[10px] text-blue-400/40 uppercase tracking-widest font-bold">
                                {group._count.campaigns} Campaigns
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
        <div className="text-center py-8 text-amber-200/40 text-sm italic">
          No employee groups available. Create groups to assign them to campaigns.
        </div>
      )}
    </div>
  );
}
