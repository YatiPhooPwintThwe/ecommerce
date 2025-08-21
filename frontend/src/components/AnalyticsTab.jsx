// src/components/AnalyticsTab.jsx
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import {
  GET_ANALYTICS,
  GET_DAILY_SALES,
  GET_MONTHLY_SALES,
  GET_REVENUE_BY_CATEGORY,
} from "../graphql/query/analytics.query.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { LayoutGrid } from "lucide-react";

export default function AnalyticsTab() {
  const navigate = useNavigate();

  // ---- date windows ----
  // Daily chart: last 30 days (inclusive) using UTC so "today" is included
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 29);
  start.setUTCHours(0, 0, 0, 0);
  const startDate = start.toISOString();
  const endDate = end.toISOString();
  const year = end.getUTCFullYear();

  // ---- queries ----
  // KPI totals
  const {
    data: aData,
    loading: aLoad,
    error: aErr,
  } = useQuery(GET_ANALYTICS, {
    fetchPolicy: "cache-and-network",
  });

  // daily (30d)
  const {
    data: dData,
    loading: dLoad,
    error: dErr,
  } = useQuery(GET_DAILY_SALES, {
    variables: { startDate, endDate },
    fetchPolicy: "cache-and-network",
  });

  // monthly (YTD)
  const {
    data: mData,
    loading: mLoad,
    error: mErr,
  } = useQuery(GET_MONTHLY_SALES, {
    variables: { year },
    fetchPolicy: "cache-and-network",
  });

  // pie (ALL-TIME): omit variables to aggregate across all orders
  const {
    data: cData,
    loading: cLoad,
    error: cErr,
  } = useQuery(GET_REVENUE_BY_CATEGORY, { fetchPolicy: "cache-and-network" });

  // ---- derived data ----
  const totals = aData?.getAnalytics ?? {
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  };
  const dailySales = dData?.getDailySales ?? [];
  const monthlySales = mData?.getMonthlySales ?? [];
  const catAll = cData?.getRevenueByCategory ?? []; // [{ category, sales, revenue }]
  const totalUnitsSold = catAll.reduce((sum, r) => sum + (r?.sales ?? 0), 0);

  const loadingCharts = aLoad || dLoad || mLoad; // for line/bar charts
  const loadingPie = cLoad; // for pie
  const error = aErr || dErr || mErr || cErr;

  const currency = (n) =>
    new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
    }).format(Number(n || 0));

  // color palette for pie
  const COLORS = [
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f472b6",
    "#a78bfa",
    "#f87171",
    "#fdba74",
    "#4ade80",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Admin Dashboard</h1>
          <button
            onClick={() => navigate("/admin/product-analysis")}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:shadow"
          >
            <LayoutGrid className="h-5 w-5" />
            Product Analysis
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load analytics. {error.message}
          </div>
        )}

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPI title="Total Users" value={totals.users ?? 0} />
          <KPI title="Total Products" value={totals.products ?? 0} />
          <KPI title="Total Orders" value={totals.totalSales ?? 0} />
          <KPI
            title="Total Revenue"
            value={currency(totals.totalRevenue ?? 0)}
          />
          <KPI title="Total Units Sold (All-Time)" value={totalUnitsSold} />
        </section>

        {/* Charts row 1: daily & monthly */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Daily Sales (Last 30 Days)">
            {loadingCharts ? (
              <SkeletonChart />
            ) : dailySales.length ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailySales}
                    margin={{ top: 8, right: 16, bottom: 8, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </Card>

          <Card title={`Monthly Sales (${year})`}>
            {loadingCharts ? (
              <SkeletonChart />
            ) : monthlySales.length ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySales}
                    margin={{ top: 8, right: 16, bottom: 8, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickMargin={8} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" barSize={28} />
                    <Bar dataKey="sales" barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </Card>

          {/* Charts row 2: pie full width */}
          <div className="lg:col-span-2">
            <Card title="Sales by Category (All-Time)">
              {loadingPie ? (
                <SkeletonChart />
              ) : catAll.length ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        formatter={(value, name) => [
                          // value is the slice’s sales; divide by total units to get %
                          `${(
                            (Number(value) / Math.max(totalUnitsSold, 1)) *
                            100
                          ).toFixed(1)}%`,
                          name,
                        ]}
                      />

                      <Legend />
                      <Pie
                        data={catAll}
                        dataKey="sales" // slice size by units sold
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        isAnimationActive={false}
                        labelLine={false}
                        // on-slice label "Category: 42.5%"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                      >
                        {catAll.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </Card>
          </div>
        </section>

        {/* Back button aligned with container */}
        <div className="pt-2">
          <button
            onClick={() => navigate("/admin/products")}
            className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-sm shadow"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="px-5 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-80 items-center justify-center rounded-xl border border-dashed text-sm text-gray-500 bg-gray-50">
      No data yet
    </div>
  );
}

function SkeletonChart() {
  return <div className="h-80 animate-pulse rounded-xl bg-gray-100" />;
}
