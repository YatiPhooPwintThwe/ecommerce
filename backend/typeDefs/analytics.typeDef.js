const analyticsTypeDef = `#graphql

   type Analytics {
   
     users: Int!
     products: Int!
     totalSales: Int!
     totalRevenue: Float!
     
   }
     
   type DailySalesData {
     
     date: String!
     sales: Int!
     revenue: Float!

    
   }

   type MonthlySalesData {

    month: String!     # YYYY-MM
    sales: Int!
    revenue: Float!
  }

   type CategoryRevenue {
    category: String!
    sales: Int!
    revenue: Float!
  }
     
   type Query {
   
     getAnalytics: Analytics!
     getDailySales(startDate: String!, endDate: String!): [DailySalesData!]!
     getMonthlySales(year: Int!): [MonthlySalesData!]!
    getRevenueByCategory(startDate: String, endDate: String): [CategoryRevenue!]!
     
   }
     
   `;

export default analyticsTypeDef;
