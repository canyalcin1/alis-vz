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
  DialogTrigger,
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
import { Loader2, Pencil, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import type { SafeUser } from "@/lib/types"

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
  const { data: users, mutate, isLoading } = useSWR<SafeUser[]>("/api/users", fetcher)
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    lab: "",
    role: "",
    department: "",
  })

  const openEditDialog = (user: SafeUser) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      lab: user.lab,
      role: user.role,
      department: user.department,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (userId: string) => {
    setDeletingUserId(userId)
    setDeleteDialogOpen(true)
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kullanıcı Yönetimi</h3>
          <p className="text-sm text-muted-foreground">
            Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin
          </p>
        </div>
        <Button size="sm" asChild>
          <a href="/register">
            <UserPlus className="mr-2 h-4 w-4" />
            Yeni Kullanıcı
          </a>
        </Button>
      </div>

      <div className="rounded-lg border">
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{LAB_LABELS[user.lab] || user.lab}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.department}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(user.id)}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Ad Soyad</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-posta</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lab">Laboratuvar</Label>
              <Select
                value={editForm.lab}
                onValueChange={(value) => setEditForm({ ...editForm, lab: value })}
              >
                <SelectTrigger id="edit-lab">
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
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Departman</Label>
              <Input
                id="edit-department"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
