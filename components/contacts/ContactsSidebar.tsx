"use client";

import { useEffect } from "react";
import { Users, Star, Building2, UserCircle, FolderPlus } from "lucide-react";
import { useContactsStore } from "@/stores/contacts-store";
import { useAccountStore } from "@/stores/account-store";
import { cn } from "@/lib/utils";

export function ContactsSidebar() {
  const {
    groups,
    selectedGroupId,
    isLoadingGroups,
    setGroups,
    setSelectedGroup,
    setLoadingGroups,
    setGroupsError,
    setFavoriteFilter,
    clearFilters,
  } = useContactsStore();

  const { activeAccountId } = useAccountStore();

  // Fetch groups when account changes
  useEffect(() => {
    if (activeAccountId) {
      fetchGroups(activeAccountId);
    }
  }, [activeAccountId]);

  const fetchGroups = async (accountId: string) => {
    try {
      setLoadingGroups(true);
      setGroupsError(null);

      const response = await fetch(`/api/contacts/groups?accountId=${accountId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch contact groups');
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error: any) {
      console.error('Error fetching contact groups:', error);
      setGroupsError(error.message);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSelectAll = () => {
    clearFilters();
    setSelectedGroup(null);
  };

  const handleSelectFavorites = () => {
    clearFilters();
    setFavoriteFilter(true);
    setSelectedGroup(null);
  };

  const handleSelectGroup = (groupId: string) => {
    clearFilters();
    setSelectedGroup(groupId);
  };

  return (
    <div className="w-[200px] border-r border-border-default bg-surface-primary flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border-default">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Groups</h2>
          <button
            className="p-1 rounded hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
            title="New Group"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* System folders */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-1">
          {/* All Contacts */}
          <button
            data-testid="select-all-contacts"
            onClick={handleSelectAll}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-bg-hover transition-colors",
              selectedGroupId === null && "bg-bg-selected text-text-primary"
            )}
          >
            <Users className="h-4 w-4 text-text-secondary" />
            <span className="flex-1 text-left">All Contacts</span>
          </button>

          {/* Favorites */}
          <button
            onClick={handleSelectFavorites}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-bg-hover transition-colors",
              "text-text-secondary hover:text-text-primary"
            )}
          >
            <Star className="h-4 w-4" />
            <span className="flex-1 text-left">Favorites</span>
          </button>
        </div>

        {/* Divider */}
        {groups.length > 0 && (
          <div className="my-1 border-t border-border-default" />
        )}

        {/* Custom groups */}
        {isLoadingGroups ? (
          <div className="px-3 py-2 text-sm text-text-secondary">
            Loading groups...
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleSelectGroup(group.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-bg-hover transition-colors",
                  selectedGroupId === group.id && "bg-bg-selected text-text-primary"
                )}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="flex-1 text-left truncate">{group.name}</span>
                {group.member_count !== undefined && (
                  <span className="text-xs text-text-secondary">
                    {group.member_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
