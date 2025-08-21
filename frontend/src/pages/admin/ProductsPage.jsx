import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Edit3, Trash2, LayoutDashboard, LogOut } from "lucide-react";
import { GET_PRODUCTS } from "../../graphql/query/product.query.js";
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
} from "../../graphql/mutation/product.mutation.js";

function fileToDateURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    Number(n || 0)
  );

export default function ProductPage() {
  const navigate = useNavigate();
  const { data, loading: loadingList } = useQuery(GET_PRODUCTS);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "1",
    category: "",
    stock: "0",
    image: "",
  });

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success("Product created");
      resetAndClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast.success("Product updated");
      resetAndClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: () => toast.success("Deleted"),
    onError: (e) => toast.error(e.message),
  });

  const products = data?.products ?? [];

  // ---- derived filtered list (by name OR category) ----
  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  });

  function resetAndClose() {
    setOpen(false);
    setEditingId(null);
    setMode("create");
    setForm({
      name: "",
      description: "",
      price: "1",
      category: "",
      stock: "0",
      image: "",
    });
  }

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      price: "1",
      category: "",
      stock: "0", // <-- add stock on create init
      image: "",
    });
    setOpen(true);
  }

  function openEdit(p) {
    setMode("edit");
    setEditingId(p._id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: String(Math.max(1, Number(p.price ?? 1))),
      category: p.category || "",
      stock: String(Math.max(0, Number(p.stock ?? 0))),
      image: "",
    });
    setOpen(true);
  }

  async function handleImagePick(file) {
    if (!file) return;
    try {
      const dataUrl = await fileToDateURL(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch {
      toast.error("Failed to read image");
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch((s) => s.trim());
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (mode === "create") {
      const { name, description, category, price } = form;
      if (!name.trim() || !description.trim() || !category.trim()) {
        return toast.error("Name, description, and category are required");
      }

      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 1) {
        return toast.error("Enter a valid price");
      }

      const stockNum = Number(form.stock); // <-- fix typo (= not -)
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        return toast.error("Enter a valid stock");
      }

      await createProduct({
        variables: {
          input: {
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            price: priceNum,
            stock: stockNum,
            image: form.image || undefined,
          },
        },
      });
    } else {
      const updates = {};
      if (form.name.trim()) updates.name = form.name.trim();
      if (form.description.trim())
        updates.description = form.description.trim();
      if (form.category.trim()) updates.category = form.category.trim();
      if (form.price !== "") {
        const priceNum = Number(form.price);
        if (!Number.isFinite(priceNum) || priceNum < 1) {
          return toast.error("Enter a valid price");
        }
        updates.price = priceNum;
      }
      if (form.stock !== "") {
        const stockNum = Number(form.stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
          return toast.error("Enter a valid stock");
        }
        updates.stock = stockNum;
      }
      if (form.image) updates.image = form.image;

      if (
        !updates.name &&
        !updates.description &&
        !updates.category &&
        updates.price == null &&
        updates.stock == null && // <-- include stock in the guard
        !updates.image
      ) {
        return toast.error("Nothing to update");
      }

      await updateProduct({
        variables: {
          input: {
            productId: editingId,
            ...updates,
          },
        },
      });
    }
  }

  async function handleDelete(p) {
    if (deleting) return;
    const ok = window.confirm(`Delete "${p.name}"? This cannot be undone.`);
    if (!ok) return;
    await deleteProduct({ variables: { productId: p._id } });
  }

  function handleLogout() {
    toast.success("Logged out");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-semibold">Admin</div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Products</h1>

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-10 mb-10 flex items-center gap-3"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category…"
            className="flex-1 max-w-3xl h-12 border rounded-lg px-4 text-base"
          />
          <button
            type="submit"
            className="h-12 px-5 rounded-lg border text-sm font-medium bg-white"
          >
            Search
          </button>
        </form>

        {loadingList ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-sm text-gray-600">
            {products.length === 0 ? (
              <>
                No products yet. Click <b>Create</b> to add one.
              </>
            ) : (
              <>No matches for “{search}”.</>
            )}
          </div>
        ) : (
          <div className="grid gap-x-10 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => (
              <div
                key={p._id}
                className="rounded-2xl border bg-white overflow-hidden shadow-sm"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  <img
                    src={
                      p.image ||
                      "https://via.placeholder.com/640x480?text=No+Image"
                    }
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                    <span className="shrink-0 text-lg font-bold text-gray-900 sm:text-xl">
                      {sgd(p.price)}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-gray-600 line-clamp-1">
                    {p.category}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        p.isFeatured
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p.isFeatured ? "Featured" : "Normal"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        disabled={deleting}
                        onClick={() => handleDelete(p)}
                        className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-3 py-1.5 text-sm disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-center">
              {mode === "create" ? "Create Product" : "Edit Product"}
            </h3>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {mode === "create" ? (
                <>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder="Description"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Category"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    step="0.01"
                    min={1}
                    placeholder="Price (SGD)"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    step="1"
                    min={0}
                    placeholder="Stock (quantity)"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stock: e.target.value }))
                    }
                    required={mode === "create"}
                  />
                </>
              ) : (
                <>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />

                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Category"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                  />

                  <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder="Description"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />

                  <input
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    step="0.01"
                    min={1}
                    placeholder="Price (SGD)"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                  />
                  <input
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    step="1"
                    min={0}
                    placeholder="Stock (quantity)"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stock: e.target.value }))
                    }
                    required={mode === "create"}
                  />
                </>
              )}

              <div className="space-y-2">
                <input
                  className="text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagePick(e.target.files?.[0])}
                />
                {form.image && (
                  <img
                    src={form.image}
                    alt="preview"
                    className="h-20 w-20 object-cover rounded border"
                  />
                )}
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm border rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="px-3 py-2 text-sm bg-black text-white rounded-md disabled:opacity-60"
                >
                  {mode === "create"
                    ? creating
                      ? "Creating..."
                      : "Create"
                    : updating
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
