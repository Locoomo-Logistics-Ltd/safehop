"use client";

import { RootTopBar } from "@/components/layout";
import { ROUTES } from "@/core/config/constants";
import { useAdminOrders } from "@/modules/admin/hooks/use-admin-orders";
import { OrderFilterBar } from "./OrderFilterBar";
import { OrderListTable } from "./OrderListTable";

/** "Order List & Filter" — matches admin_UI.png. */
export function OrderListScreen() {
  const { orders, isLoading, filters, setFilters, resetFilters } = useAdminOrders();

  return (
    <div className="min-h-screen">
      <RootTopBar profileHref={ROUTES.adminProfile} hideOnDesktop />

      <div className="px-4 md:px-6 pt-2 md:pt-8 pb-10">
        <div className="hidden md:block mb-6">
          <h1 className="font-display text-[22px] font-bold text-text-primary">All Orders</h1>
          <p className="text-[13px] text-text-muted mt-0.5">
            Search, filter and track every order across the network.
          </p>
        </div>

        <OrderFilterBar filters={filters} onChange={setFilters} onReset={resetFilters} />
        <OrderListTable orders={orders} isLoading={isLoading} />
      </div>
    </div>
  );
}
