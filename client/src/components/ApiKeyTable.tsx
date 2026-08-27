import React from 'react';
import { Trash2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

interface ApiKeyTableProps {
  keys: ApiKey[];
  onRevoke: (keyId: string) => void;
}

const ApiKeyTable: React.FC<ApiKeyTableProps> = ({ keys, onRevoke }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Prefix</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Scopes</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Used</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Action</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{key.name}</p>
              </td>
              <td className="py-3 px-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                  {key.prefix}
                </code>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1 flex-wrap">
                  {key.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {formatDate(key.createdAt)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {key.lastUsedAt ? formatDate(key.lastUsedAt) : '—'}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusColor(
                    key.isActive
                  )}`}
                >
                  {key.isActive ? 'Active' : 'Revoked'}
                </span>
              </td>
              <td className="py-3 px-4">
                <button
                  onClick={() => onRevoke(key.id)}
                  disabled={!key.isActive}
                  className="inline-flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={key.isActive ? 'Revoke this key' : 'Already revoked'}
                >
                  <Trash2 className="w-4 h-4" />
                  {key.isActive ? 'Revoke' : 'Revoked'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApiKeyTable;
