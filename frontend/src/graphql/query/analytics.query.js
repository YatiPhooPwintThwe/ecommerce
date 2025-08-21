import { gql } from "@apollo/client";

export const GET_ANALYTICS = gql`
  query GetAnalytics {
    getAnalytics {
      users
      products
      totalSales
      totalRevenue
    }
  }
`;

export const GET_DAILY_SALES = gql`
  query GetDailySales($startDate: String!, $endDate: String!) {
    getDailySales(startDate: $startDate, endDate: $endDate) {
      date
      sales
      revenue
    }
  }
`;

export const GET_MONTHLY_SALES = gql`
  query GetMonthlySales($year: Int!) {
    getMonthlySales(year: $year) {
      month
      sales
      revenue
    }
  }
`;

export const GET_REVENUE_BY_CATEGORY = gql`
  query GetRevenueByCategory($startDate: String, $endDate: String) {
    getRevenueByCategory(startDate: $startDate, endDate: $endDate) {
      category
      sales
      revenue
    }
  }
`;
