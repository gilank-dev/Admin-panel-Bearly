'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore'
import { getFirestore } from '@/lib/firebase'

interface UserUsage {
  userId: string
  userEmail: string
  tier: 'free' | 'premium' | 'admin'
  tokensUsedToday: number
  dailyLimit: number
  totalTokensUsed: number
  lastResetDate: string
}

interface AdminConfig {
  adminEmails: string[]
}

export default function AdminDashboard() {
  const { user, loading, isAdmin, signIn, logOut } = useAuth()
  const [users, setUsers] = useState<UserUsage[]>([])
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'analytics'>('users')
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    if (!user || !isAdmin) return
    try {
      const db = await getFirestore()
      if (!db) return

      const configRef = doc(db, 'config', 'admin')
      const configSnap = await getDoc(configRef)
      if (configSnap.exists()) {
        setAdminConfig(configSnap.data() as AdminConfig)
      }

      const usersRef = collection(db, 'user_usage')
      const usersSnapshot = await getDocs(usersRef)
      const usersData = usersSnapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data(),
      })) as UserUsage[]
      setUsers(usersData)
      setLoadingData(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoadingData(false)
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadData()
    }
  }, [loading, user, isAdmin, loadData])

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim() || !adminConfig) return
    try {
      const db = await getFirestore()
      if (!db) return
      const configRef = doc(db, 'config', 'admin')
      await updateDoc(configRef, {
        adminEmails: [...adminConfig.adminEmails, newAdminEmail.trim()],
      })
      setAdminConfig({ ...adminConfig, adminEmails: [...adminConfig.adminEmails, newAdminEmail.trim()] })
      setNewAdminEmail('')
      alert(`Added ${newAdminEmail} as admin!`)
    } catch (error) {
      alert('Failed to add admin')
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    if (!adminConfig) return
    try {
      const db = await getFirestore()
      if (!db) return
      const configRef = doc(db, 'config', 'admin')
      const newEmails = adminConfig.adminEmails.filter(e => e !== email)
      await updateDoc(configRef, { adminEmails: newEmails })
      setAdminConfig({ ...adminConfig, adminEmails: newEmails })
    } catch (error) {
      alert('Failed to remove admin')
    }
  }

  const handleUpdateTier = async (userId: string, newTier: 'free' | 'premium' | 'admin') => {
    try {
      const db = await getFirestore()
      if (!db) return
      const limits: Record<string, number> = { free: 10000, premium: 100000, admin: -1 }
      const userRef = doc(db, 'user_usage', userId)
      await updateDoc(userRef, { tier: newTier, dailyLimit: limits[newTier] })
      setUsers(users.map(u => u.userId === userId ? { ...u, tier: newTier, dailyLimit: limits[newTier] } : u))
    } catch (error) {
      alert('Failed to update tier')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Delete user ${userId}?`)) return
    try {
      const db = await getFirestore()
      if (!db) return
      await deleteDoc(doc(db, 'user_usage', userId))
      setUsers(users.filter(u => u.userId !== userId))
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const handleResetUsage = async (userId: string) => {
    try {
      const db = await getFirestore()
      if (!db) return
      const userRef = doc(db, 'user_usage', userId)
      await updateDoc(userRef, { tokensUsedToday: 0, lastResetDate: new Date().toISOString().split('T')[0] })
      setUsers(users.map(u => u.userId === userId ? { ...u, tokensUsedToday: 0 } : u))
    } catch (error) {
      alert('Failed to reset usage')
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    return users.filter(u => 
      u.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const stats = useMemo(() => ({
    totalUsers: users.length,
    freeUsers: users.filter(u => u.tier === 'free').length,
    premiumUsers: users.filter(u => u.tier === 'premium').length,
    adminUsers: users.filter(u => u.tier === 'admin').length,
    totalTokensToday: users.reduce((acc, u) => acc + (u.tokensUsedToday || 0), 0),
    totalTokensAll: users.reduce((acc, u) => acc + (u.totalTokensUsed || 0), 0),
  }), [users])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center p-6 rounded-xl border border-gray-800 bg-gray-900">
          <h1 className="text-2xl font-bold text-white mb-3">Bearly Admin Panel</h1>
          <p className="text-gray-400 text-sm mb-4">Sign in with your admin account</p>
          <button onClick={signIn} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center p-6 rounded-xl border border-red-900/50 bg-red-950/20">
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm mb-3">Your account does not have admin privileges</p>
          <button onClick={logOut} className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700">Sign Out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Bearly Admin</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button onClick={logOut} className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700">Sign Out</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          {[
            { id: 'users', label: 'Users' },
            { id: 'settings', label: 'Settings' },
            { id: 'analytics', label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-lg font-bold text-green-400">{(stats.totalTokensToday / 1000).toFixed(1)}K</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                <p className="text-xs text-gray-500">All Time</p>
                <p className="text-lg font-bold text-purple-400">{(stats.totalTokensAll / 1000000).toFixed(2)}M</p>
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-600 mb-3"
            />

            {/* Users List */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Users ({filteredUsers.length})</h2>
                <button onClick={loadData} className="text-xs text-gray-400 hover:text-white">Refresh</button>
              </div>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No users found</div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">User</th>
                        <th className="px-3 py-2 text-left font-medium">Tier</th>
                        <th className="px-3 py-2 text-left font-medium">Usage</th>
                        <th className="px-3 py-2 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.userId} className="border-t border-gray-800/50 text-sm">
                          <td className="px-3 py-3">
                            <p className="text-white font-mono text-xs">{u.userId.slice(0, 8)}...</p>
                            <p className="text-gray-500 text-xs">{u.userEmail || 'N/A'}</p>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={u.tier}
                              onChange={(e) => handleUpdateTier(u.userId, e.target.value as any)}
                              className={`px-2 py-1 rounded text-xs font-medium border ${
                                u.tier === 'admin' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                                u.tier === 'premium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                                'text-gray-400 bg-gray-500/10 border-gray-500/30'
                              }`}
                            >
                              <option value="free">Free</option>
                              <option value="premium">Premium</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-3 py-3 text-gray-400 text-xs">
                            {u.dailyLimit === -1 ? '∞' : `${(u.tokensUsedToday / 1000).toFixed(1)}K/${(u.dailyLimit / 1000).toFixed(0)}K`}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleResetUsage(u.userId)} className="p-1.5 rounded hover:bg-blue-500/20 text-gray-400 hover:text-blue-400" title="Reset">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.058M20.97 12a9 9 0 11-1.97-5.644M15 11l3-3m0 0l-3-3m3 3H9" /></svg>
                              </button>
                              <button onClick={() => handleDeleteUser(u.userId)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400" title="Delete">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Admin Emails</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {adminConfig?.adminEmails.map(email => (
                  <div key={email} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs">
                    {email}
                    <button onClick={() => handleRemoveAdmin(email)} className="hover:text-red-300">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Add admin email..."
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                />
                <button onClick={handleAddAdmin} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">Add</button>
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Usage Limits</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Free</p>
                  <p className="text-lg font-bold text-gray-400">10K</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Premium</p>
                  <p className="text-lg font-bold text-yellow-400">100K</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Admin</p>
                  <p className="text-lg font-bold text-red-400">∞</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs text-blue-400 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-400 mb-1">Tokens Today</p>
                <p className="text-2xl font-bold text-white">{(stats.totalTokensToday / 1000).toFixed(1)}K</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-xs text-purple-400 mb-1">Total Tokens</p>
                <p className="text-2xl font-bold text-white">{(stats.totalTokensAll / 1000000).toFixed(2)}M</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-xs text-orange-400 mb-1">Admins</p>
                <p className="text-2xl font-bold text-white">{adminConfig?.adminEmails.length || 0}</p>
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Tier Distribution</h2>
              <div className="h-3 rounded-full bg-gray-800 overflow-hidden flex mb-3">
                <div className="bg-gray-500" style={{ width: `${(stats.freeUsers / stats.totalUsers) * 100 || 0}%` }} />
                <div className="bg-yellow-500" style={{ width: `${(stats.premiumUsers / stats.totalUsers) * 100 || 0}%` }} />
                <div className="bg-red-500" style={{ width: `${(stats.adminUsers / stats.totalUsers) * 100 || 0}%` }} />
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-500" /><span className="text-gray-400">Free ({stats.freeUsers})</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="text-gray-400">Premium ({stats.premiumUsers})</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-gray-400">Admin ({stats.adminUsers})</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
