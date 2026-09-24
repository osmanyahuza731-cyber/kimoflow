export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_code: string
          category: string | null
          condition: string
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          asset_code: string
          category?: string | null
          condition?: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          asset_code?: string
          category?: string | null
          condition?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          label: string | null
          mime_type: string | null
          record_id: string
          record_type: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          label?: string | null
          mime_type?: string | null
          record_id: string
          record_type: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          label?: string | null
          mime_type?: string | null
          record_id?: string
          record_type?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          after_value: Json | null
          before_value: Json | null
          created_at: string
          id: string
          reason: string | null
          record_id: string | null
          record_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          record_id?: string | null
          record_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          record_id?: string | null
          record_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          job_id: string | null
          provider_response: string | null
          status: string
          template: string | null
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          job_id?: string | null
          provider_response?: string | null
          status?: string
          template?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          job_id?: string | null
          provider_response?: string | null
          status?: string
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_types: {
        Row: {
          code: string
          created_at: string
          default_discount_percent: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          default_discount_percent?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_discount_percent?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          alt_phone: string | null
          assigned_staff_id: string | null
          business_name: string | null
          contact_person: string | null
          contact_position: string | null
          created_at: string
          created_by: string | null
          credit_hold: boolean
          credit_limit: number
          customer_code: string
          customer_type_id: string
          email: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string
          preferred_contact: string
          registration_date: string
          service_category_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          assigned_staff_id?: string | null
          business_name?: string | null
          contact_person?: string | null
          contact_position?: string | null
          created_at?: string
          created_by?: string | null
          credit_hold?: boolean
          credit_limit?: number
          customer_code: string
          customer_type_id: string
          email?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone: string
          preferred_contact?: string
          registration_date?: string
          service_category_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          assigned_staff_id?: string | null
          business_name?: string | null
          contact_person?: string | null
          contact_position?: string | null
          created_at?: string
          created_by?: string | null
          credit_hold?: boolean
          credit_limit?: number
          customer_code?: string
          customer_type_id?: string
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string
          preferred_contact?: string
          registration_date?: string
          service_category_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_customer_type_id_fkey"
            columns: ["customer_type_id"]
            isOneToOne: false
            referencedRelation: "customer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          expense_number: string
          id: string
          method: string
          notes: string | null
          payment_account_id: string | null
          purpose: string
          receipt_path: string | null
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          expense_number: string
          id?: string
          method?: string
          notes?: string | null
          payment_account_id?: string | null
          purpose: string
          receipt_path?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          expense_number?: string
          id?: string
          method?: string
          notes?: string | null
          payment_account_id?: string | null
          purpose?: string
          receipt_path?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          batch_reference: string | null
          category: string | null
          cost_per_unit: number
          created_at: string
          expiry_date: string | null
          id: string
          is_active: boolean
          item_code: string
          min_quantity: number
          name: string
          purchase_date: string | null
          quantity: number
          reorder_level: number
          reserved_quantity: number
          store_id: string
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          batch_reference?: string | null
          category?: string | null
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          item_code: string
          min_quantity?: number
          name: string
          purchase_date?: string | null
          quantity?: number
          reorder_level?: number
          reserved_quantity?: number
          store_id: string
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          batch_reference?: string | null
          category?: string | null
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          item_code?: string
          min_quantity?: number
          name?: string
          purchase_date?: string | null
          quantity?: number
          reorder_level?: number
          reserved_quantity?: number
          store_id?: string
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          balance_after: number | null
          created_at: string
          created_by: string | null
          from_store_id: string | null
          id: string
          inventory_item_id: string
          job_id: string | null
          quantity: number
          reason: string | null
          reference: string | null
          to_store_id: string | null
          transaction_type: string
          unit_cost: number
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          from_store_id?: string | null
          id?: string
          inventory_item_id: string
          job_id?: string | null
          quantity: number
          reason?: string | null
          reference?: string | null
          to_store_id?: string | null
          transaction_type: string
          unit_cost?: number
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          from_store_id?: string | null
          id?: string
          inventory_item_id?: string
          job_id?: string | null
          quantity?: number
          reason?: string | null
          reference?: string | null
          to_store_id?: string | null
          transaction_type?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_from_store_id_fkey"
            columns: ["from_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string | null
          customer_id: string
          discount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          job_id: string | null
          notes: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          job_id?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          job_id?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_items: {
        Row: {
          created_at: string
          description: string | null
          discount: number
          id: string
          job_id: string
          line_total: number
          quantity: number
          service_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount?: number
          id?: string
          job_id: string
          line_total?: number
          quantity?: number
          service_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          discount?: number
          id?: string
          job_id?: string
          line_total?: number
          quantity?: number
          service_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      job_materials: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          job_id: string
          quantity_consumed: number
          quantity_required: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          job_id: string
          quantity_consumed?: number
          quantity_required?: number
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          job_id?: string
          quantity_consumed?: number
          quantity_required?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_materials_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          job_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          job_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          job_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          amount_paid: number
          assigned_staff_id: string | null
          category_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          discount: number
          due_date: string | null
          id: string
          instructions: string | null
          job_number: string
          labour_cost: number
          machine_cost: number
          machine_id: string | null
          material_cost: number
          other_cost: number
          outsourcing_cost: number
          payment_status: string
          priority: string
          specifications: Json
          status: string
          subtotal: number
          tax: number
          title: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          assigned_staff_id?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount?: number
          due_date?: string | null
          id?: string
          instructions?: string | null
          job_number: string
          labour_cost?: number
          machine_cost?: number
          machine_id?: string | null
          material_cost?: number
          other_cost?: number
          outsourcing_cost?: number
          payment_status?: string
          priority?: string
          specifications?: Json
          status?: string
          subtotal?: number
          tax?: number
          title?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          assigned_staff_id?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount?: number
          due_date?: string | null
          id?: string
          instructions?: string | null
          job_number?: string
          labour_cost?: number
          machine_cost?: number
          machine_id?: string | null
          material_cost?: number
          other_cost?: number
          outsourcing_cost?: number
          payment_status?: string
          priority?: string
          specifications?: Json
          status?: string
          subtotal?: number
          tax?: number
          title?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account: string
          created_at: string
          created_by: string | null
          credit: number
          debit: number
          description: string | null
          entry_date: string
          entry_type: string
          expense_id: string | null
          id: string
          job_id: string | null
          payment_id: string | null
          reference: string | null
        }
        Insert: {
          account: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          description?: string | null
          entry_date?: string
          entry_type: string
          expense_id?: string | null
          id?: string
          job_id?: string | null
          payment_id?: string | null
          reference?: string | null
        }
        Update: {
          account?: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          description?: string | null
          entry_date?: string
          entry_type?: string
          expense_id?: string | null
          id?: string
          job_id?: string | null
          payment_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_readings: {
        Row: {
          created_at: string
          id: string
          machine_id: string
          notes: string | null
          reading: number
          reading_date: string
          recorded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          machine_id: string
          notes?: string | null
          reading: number
          reading_date?: string
          recorded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          machine_id?: string
          notes?: string | null
          reading?: number
          reading_date?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_readings_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          counter_at_purchase: number | null
          created_at: string
          current_counter: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          last_maintenance: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string
          supplier: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          counter_at_purchase?: number | null
          created_at?: string
          current_counter?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_maintenance?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          supplier?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          counter_at_purchase?: number | null
          created_at?: string
          current_counter?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          last_maintenance?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          supplier?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          machine_id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance: string | null
          parts_replaced: string | null
          service_provider: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          machine_id: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance?: string | null
          parts_replaced?: string | null
          service_provider?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          machine_id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance?: string | null
          parts_replaced?: string | null
          service_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          provider: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          provider?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cheque_number: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          customer_id: string
          id: string
          invoice_id: string | null
          job_id: string | null
          method: string
          momo_sender_phone: string | null
          notes: string | null
          paid_at: string
          payment_account_id: string | null
          proof_path: string | null
          receipt_number: string | null
          received_by: string | null
          reference: string | null
          reversal_reason: string | null
          reversed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          cheque_number?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id: string
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          method: string
          momo_sender_phone?: string | null
          notes?: string | null
          paid_at?: string
          payment_account_id?: string | null
          proof_path?: string | null
          receipt_number?: string | null
          received_by?: string | null
          reference?: string | null
          reversal_reason?: string | null
          reversed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cheque_number?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          method?: string
          momo_sender_phone?: string | null
          notes?: string | null
          paid_at?: string
          payment_account_id?: string | null
          proof_path?: string | null
          receipt_number?: string | null
          received_by?: string | null
          reference?: string | null
          reversal_reason?: string | null
          reversed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string
          customer_type_id: string | null
          discount_percent: number
          id: string
          is_active: boolean
          minimum_price: number | null
          price: number | null
          promo_price: number | null
          service_id: string
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          customer_type_id?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          minimum_price?: number | null
          price?: number | null
          promo_price?: number | null
          service_id: string
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          customer_type_id?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          minimum_price?: number | null
          price?: number | null
          promo_price?: number | null
          service_id?: string
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_customer_type_id_fkey"
            columns: ["customer_type_id"]
            isOneToOne: false
            referencedRelation: "customer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          emergency_contact: string | null
          employment_status: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          position: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          employment_status?: string
          full_name?: string
          id: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          position?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          employment_status?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          position?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          description: string | null
          discount: number
          id: string
          line_total: number
          quantity: number
          quotation_id: string
          service_id: string | null
          unit_price: number
        }
        Insert: {
          description?: string | null
          discount?: number
          id?: string
          line_total?: number
          quantity?: number
          quotation_id: string
          service_id?: string | null
          unit_price?: number
        }
        Update: {
          description?: string | null
          discount?: number
          id?: string
          line_total?: number
          quantity?: number
          quotation_id?: string
          service_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          discount: number
          expiry_date: string | null
          id: string
          issue_date: string
          job_id: string | null
          notes: string | null
          quotation_number: string
          status: string
          subtotal: number
          tax: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          job_id?: string | null
          notes?: string | null
          quotation_number: string
          status?: string
          subtotal?: number
          tax?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount?: number
          expiry_date?: string | null
          id?: string
          issue_date?: string
          job_id?: string | null
          notes?: string | null
          quotation_number?: string
          status?: string
          subtotal?: number
          tax?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_materials: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          quantity_per_unit: number
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          quantity_per_unit?: number
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          quantity_per_unit?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_materials_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_materials_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          category_id: string
          created_at: string
          default_margin_percent: number
          description: string | null
          id: string
          is_active: boolean
          labour_cost: number
          machine_id: string | null
          min_quantity: number
          name: string
          production_minutes: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id: string
          created_at?: string
          default_margin_percent?: number
          description?: string | null
          id?: string
          is_active?: boolean
          labour_cost?: number
          machine_id?: string | null
          min_quantity?: number
          name: string
          production_minutes?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string
          created_at?: string
          default_margin_percent?: number
          description?: string | null
          id?: string
          is_active?: boolean
          labour_cost?: number
          machine_id?: string | null
          min_quantity?: number
          name?: string
          production_minutes?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      staff_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          staff_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          staff_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          staff_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_enquiries: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          service_interest: string | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          service_interest?: string | null
          source?: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          service_interest?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_enquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_document_number: { Args: { _kind: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "secretary"
        | "cashier"
        | "accountant"
        | "graphic_artist"
        | "production_operator"
        | "storekeeper"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "secretary",
        "cashier",
        "accountant",
        "graphic_artist",
        "production_operator",
        "storekeeper",
      ],
    },
  },
} as const
