'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { Navbar, Card, Button } from '@/components/ui'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { ReportStatus, ReportReason } from '@/types'

interface ReportUserSummary {
  id: string
  username: string | null
  email: string | null
}

interface AdminReport {
  id: string
  reporter_id: string
  reported_user_id: string
  conversation_id: string | null
  reason: ReportReason
  description: string | null
  status: ReportStatus
  created_at: string
  reviewed_at: string | null
  reporter: ReportUserSummary | null
  reported: ReportUserSummary | null
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Beklemede',
  reviewed: 'İncelendi',
  action_taken: 'Aksiyon Alındı',
  dismissed: 'Reddedildi',
}

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  reviewed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  action_taken: 'bg-green-500/15 text-green-300 border-green-500/30',
  dismissed: 'bg-red-500/15 text-red-300 border-red-500/30',
}

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Taciz',
  inappropriate: 'Uygunsuz',
  other: 'Diğer',
}

export default function AdminReportsPage() {
  const { language } = useTranslation()
  const dateLocale = language === 'tr' ? tr : enUS
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const getAccessToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Giriş yapmanız gerekiyor')
    }
    return session.access_token
  }, [])

  const checkAdmin = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/check')
      const data = await response.json()
      setIsAdmin(Boolean(data?.isAdmin))
    } catch {
      setIsAdmin(false)
    }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getAccessToken()
      const response = await fetch('/api/admin/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Şikayetler yüklenemedi')
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayetler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchReports()
    }
  }, [isAdmin, fetchReports])

  const filteredReports = useMemo(() => {
    if (filterStatus === 'all') return reports
    return reports.filter(report => report.status === filterStatus)
  }, [reports, filterStatus])

  const updateStatus = useCallback(async (reportId: string, status: ReportStatus) => {
    try {
      setActionLoadingId(reportId)
      const token = await getAccessToken()
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: reportId, status }),
      })

      if (!response.ok) {
        throw new Error('Şikayet güncellenemedi')
      }

      const data = await response.json()
      setReports(prev => prev.map(report => report.id === reportId ? { ...report, ...data.report } : report))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şikayet güncellenemedi')
    } finally {
      setActionLoadingId(null)
    }
  }, [getAccessToken])

  const banUser = useCallback(async (report: AdminReport) => {
    try {
      setActionLoadingId(report.id)
      const token = await getAccessToken()
      const response = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: report.reported_user_id,
          reason: `Report ${report.id}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Ban işlemi başarısız')
      }

      await updateStatus(report.id, 'action_taken')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ban işlemi başarısız')
      setActionLoadingId(null)
    }
  }, [getAccessToken, updateStatus])

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black">
        <Navbar />
        <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
          <Card className="text-center">
            <h1 className="text-xl font-semibold text-white">Erişim yok</h1>
            <p className="text-white/60 mt-2">Bu sayfayı görüntülemek için admin yetkisi gerekiyor.</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] to-black">
      <Navbar />

      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Şikayetler</h1>
            <p className="text-white/50 text-sm">Şikayetleri inceleyip aksiyon alabilirsiniz.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as ReportStatus | 'all')}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="reviewed">İncelendi</option>
              <option value="action_taken">Aksiyon Alındı</option>
              <option value="dismissed">Reddedildi</option>
            </select>
            <Button variant="secondary" size="sm" onClick={fetchReports} isLoading={loading}>
              Yenile
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border border-red-500/30 bg-red-500/10 text-red-200 mb-6">
            {error}
          </Card>
        )}

        {loading && reports.length === 0 ? (
          <Card>Yükleniyor...</Card>
        ) : filteredReports.length === 0 ? (
          <Card>Henüz şikayet yok.</Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-white/40 text-xs">
                      {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                    </p>
                    <h2 className="text-lg font-semibold text-white">
                      {REASON_LABELS[report.reason]}
                    </h2>
                    {report.description && (
                      <p className="text-white/60 text-sm">{report.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_STYLES[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs">Şikayet Eden</p>
                    <p className="text-white/80">{report.reporter?.username || 'Bilinmiyor'}</p>
                    {report.reporter?.email && (
                      <p className="text-white/40 text-xs mt-1">{report.reporter.email}</p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs">Şikayet Edilen</p>
                    <p className="text-white/80">{report.reported?.username || 'Bilinmiyor'}</p>
                    {report.reported?.email && (
                      <p className="text-white/40 text-xs mt-1">{report.reported.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(report.id, 'reviewed')}
                    isLoading={actionLoadingId === report.id}
                  >
                    İncelendi
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateStatus(report.id, 'dismissed')}
                    isLoading={actionLoadingId === report.id}
                    className="text-red-200"
                  >
                    Reddet
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => banUser(report)}
                    isLoading={actionLoadingId === report.id}
                  >
                    Kullanıcıyı Banla
                  </Button>
                </div>

                {report.reviewed_at && (
                  <p className="text-white/30 text-xs">
                    Son işlem: {format(new Date(report.reviewed_at), 'dd MMM yyyy HH:mm', { locale: dateLocale })}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
