'use client'

import { useState, useEffect } from 'react'

interface Withdrawal {
    id: string
    wallet_address: string
    wld_amount: number
    status: string
    created_at: string
    user_id: string
}

export default function AdminPage() {
    const [password, setPassword] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [sessionToken, setSessionToken] = useState<string | null>(null)

    // Check for existing session (using sessionStorage instead of localStorage for security)
    useEffect(() => {
        const token = sessionStorage.getItem('admin_session')
        if (token) {
            setSessionToken(token)
            setIsAuthenticated(true)
            fetchWithdrawals(token)
        }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        // Verify password with backend first
        try {
            const res = await fetch('/api/admin/withdrawals', {
                headers: { 'Authorization': `Bearer ${password}` }
            })
            if (res.ok) {
                // Store in sessionStorage (cleared on browser close, not persistent)
                sessionStorage.setItem('admin_session', password)
                setSessionToken(password)
                setIsAuthenticated(true)
                const data = await res.json()
                setWithdrawals(data.withdrawals || [])
            } else {
                alert('Invalid password')
            }
        } catch (e) {
            console.error(e)
            alert('Login failed')
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('admin_session')
        setSessionToken(null)
        setIsAuthenticated(false)
        setPassword('')
        setWithdrawals([])
    }

    const fetchWithdrawals = async (pwd: string) => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/withdrawals', {
                headers: { 'Authorization': `Bearer ${pwd}` }
            })
            if (res.ok) {
                const data = await res.json()
                setWithdrawals(data.withdrawals || [])
            } else {
                alert('Unauthorized')
                handleLogout()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const updateStatus = async (id: string, status: string, hash?: string) => {
        if (!confirm(`Mark as ${status}?`)) return
        if (!sessionToken) return

        try {
            const res = await fetch('/api/admin/withdrawals', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ id, status, transaction_hash: hash })
            })

            if (res.ok) {
                fetchWithdrawals(sessionToken)
            } else {
                alert('Error updating status')
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleExportCSV = async () => {
        if (!sessionToken) return

        try {
            const res = await fetch('/api/admin/withdrawals/export', {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                a.remove()
                window.URL.revokeObjectURL(url)
            } else {
                alert('Export failed')
            }
        } catch (e) {
            console.error(e)
            alert('Export failed')
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="space-y-4">
                    <h1 className="text-2xl font-bold">Void Admin</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Admin Password"
                        className="bg-gray-800 p-2 rounded w-full border border-gray-700"
                        autoComplete="current-password"
                    />
                    <button type="submit" className="bg-blue-600 px-4 py-2 rounded w-full">Login</button>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Void Withdrawals</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExportCSV}
                            className="bg-green-600 px-4 py-2 rounded"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={() => sessionToken && fetchWithdrawals(sessionToken)}
                            className="bg-gray-700 px-4 py-2 rounded"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 px-4 py-2 rounded"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Wallet</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {withdrawals.map(w => (
                                <tr key={w.id} className="hover:bg-gray-800/50">
                                    <td className="p-4 text-sm text-gray-400">
                                        {new Date(w.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-sm max-w-xs truncate" title={w.wallet_address}>
                                        {w.wallet_address}
                                    </td>
                                    <td className="p-4">{w.wld_amount} WLD</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase
                                            ${w.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : ''}
                                            ${w.status === 'paid' ? 'bg-green-900 text-green-300' : ''}
                                            ${w.status === 'rejected' ? 'bg-red-900 text-red-300' : ''}
                                            ${w.status === 'approved' ? 'bg-blue-900 text-blue-300' : ''}
                                        `}>
                                            {w.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        {w.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(w.id, 'approved')}
                                                    className="px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(w.id, 'rejected')}
                                                    className="px-3 py-1 bg-red-600 rounded text-xs hover:bg-red-500"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {w.status === 'approved' && (
                                            <button
                                                onClick={() => {
                                                    const hash = prompt('Enter transaction hash (optional):')
                                                    if (hash !== null) updateStatus(w.id, 'paid', hash)
                                                }}
                                                className="px-3 py-1 bg-green-600 rounded text-xs hover:bg-green-500"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {withdrawals.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No withdrawals found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
