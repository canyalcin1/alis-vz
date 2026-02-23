"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Pencil, Trash2, UserPlus, Key, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { SafeUser } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  analiz_member: "Analiz Lab. Üyesi",
  lab_member: "Laboratuvar Üyesi",
}

const LAB_LABELS: Record<string, string> = {
  admin: "Yönetim",
  analiz: "Analiz Laboratuvarı",
  proses: "Proses Laboratuvarı",
  otomotiv: "Otomotiv Laboratuvarı",
}

const ROLE_OPTIONS = [
  { value: "lab_member", label: "Laboratuvar Üyesi" },
  { value: "analiz_member", label: "Analiz Lab. Üyesi" },
  { value: "admin", label: "Admin" },
]

const LAB_OPTIONS = [
  { value: "proses", label: "Proses Laboratuvarı" },
  { value: "otomotiv", label: "Otomotiv Laboratuvarı" },
  { value: "analiz", label: "Analiz Laboratuvarı" },
  { value: "admin", label: "Yönetim" },
]

export function UserManagement() {
  const { user } = useAuth()
  const { data: users, mutate, isLoading } = useSWR<SafeUser[]>("/api/users", fetcher)

  // Düzenleme Stateleri
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    lab: "",
    role: "",
    department: "",
  })

  // Silme Stateleri
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Erişim Yönetimi Stateleri
  const [accessDialogOpen, setAccessDialogOpen] = useState(false)
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<SafeUser | null>(null)
  const [userAccessList, setUserAccessList] = useState<any[]>([])
  const [loadingAccess, setLoadingAccess] = useState(false)

  // Yeni Kullanıcı Stateleri
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    lab: "",
    role: "",
    department: "",
  })

  // --- FONKSİYONLAR ---

  const handleCreateUser = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Oluşturma başarısız")
      }

      toast.success("Kullanıcı başarıyla oluşturuldu")
      mutate()
      setCreateDialogOpen(false)
      setCreateForm({ name: "", email: "", password: "", lab: "", role: "", department: "" })
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu")
    } finally {
      setCreating(false)
    }
  }

  const openEditDialog = (userData: SafeUser) => {
    setEditingUser(userData)
    setEditForm({
      name: userData.name,
      email: userData.email,
      lab: userData.lab,
      role: userData.role,
      department: userData.department,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Güncelleme başarısız")
      }

      toast.success("Kullanıcı başarıyla güncellendi")
      mutate()
      setEditDialogOpen(false)
      setEditingUser(null)
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (userId: string) => {
    setDeletingUserId(userId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingUserId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${deletingUserId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Silme başarısız")
      }

      toast.success("Kullanıcı başarıyla silindi")
      mutate()
      setDeleteDialogOpen(false)
      setDeletingUserId(null)
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  const openAccessDialog = async (userData: SafeUser) => {
    setSelectedUserForAccess(userData)
    setAccessDialogOpen(true)
    setLoadingAccess(true)
    try {
      const res = await fetch(`/api/users/${userData.id}/access`)
      if (res.ok) {
        const data = await res.json()
        setUserAccessList(data)
      }
    } catch (error) {
      toast.error("Erişim listesi alınamadı")
    } finally {
      setLoadingAccess(false)
    }
  }

  const handleRevokeAccess = async (documentId: string) => {
    if (!selectedUserForAccess) return
    try {
      const res = await fetch(`/api/users/${selectedUserForAccess.id}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      })

      if (res.ok) {
        toast.success("Erişim başarıyla kaldırıldı")
        setUserAccessList((prev) => prev.filter((doc) => doc.id !== documentId))
      } else {
        toast.error("Erişim kaldırılamadı")
      }
    } catch (error) {
      toast.error("Bir hata oluştu")
    }
  }

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Kullanıcı bulunamadı
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Üst Kısım */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kullanıcı Yönetimi</h3>
          <p className="text-sm text-muted-foreground">
            Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yeni Kullanıcı Ekle
        </Button>
      </div>

      {/* Tablo */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Laboratuvar</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Departman</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-background">{LAB_LABELS[u.lab] || u.lab}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABELS[u.role] || u.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.department}</TableCell>
                <TableCell className="text-right">
                  {/* DÜZELTİLEN KISIM: Butonlar yan yana, iç içe değil */}
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Erişim Yönetimi"
                      onClick={() => openAccessDialog(u)}
                    >
                      <Key className="h-4 w-4 text-warning" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Düzenle"
                      onClick={() => openEditDialog(u)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sil"
                      onClick={() => openDeleteDialog(u.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 1. Yeni Kullanıcı Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
            <DialogDescription>
              Sisteme yeni bir kullanıcı ekleyin. Kullanıcı bu e-posta ve şifre ile giriş yapacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Geçici Şifre</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Laboratuvar</Label>
              <Select
                value={createForm.lab}
                onValueChange={(value) => setCreateForm({ ...createForm, lab: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Laboratuvar seçin" />
                </SelectTrigger>
                <SelectContent>
                  {LAB_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter(opt => user?.role === "admin" || opt.value !== "admin").map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departman</Label>
              <Input
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Oluşturuluyor...</> : "Kullanıcı Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Düzenleme Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
            <DialogDescription>Kullanıcı bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Laboratuvar</Label>
              <Select
                value={editForm.lab}
                onValueChange={(value) => setEditForm({ ...editForm, lab: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAB_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter(opt => user?.role === "admin" || opt.value !== "admin").map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departman</Label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</> : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Silme Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Siliniyor...</> : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. YENİLENMİŞ Erişim Yönetimi Modal */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-warning" />
              Erişim Yönetimi
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{selectedUserForAccess?.name}</span> adlı kullanıcının tam erişim yetkisi olduğu dokümanlar aşağıda listelenmektedir.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {loadingAccess ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userAccessList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-secondary/10">
                <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground">Erişim Yetkisi Bulunmuyor</p>
                <p className="text-xs text-muted-foreground mt-1">Bu kullanıcının henüz onaylanmış bir doküman erişimi yok.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {userAccessList.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{doc.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{doc.fileName}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0 w-full sm:w-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm("Bu dokümana olan erişimi kaldırmak istediğinize emin misiniz?")) {
                          handleRevokeAccess(doc.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Erişimi Kaldır
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setAccessDialogOpen(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}