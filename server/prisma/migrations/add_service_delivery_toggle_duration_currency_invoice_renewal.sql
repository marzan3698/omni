-- Service: Add useDeliveryDate, durationDays, currency; make delivery dates optional
ALTER TABLE services ADD COLUMN use_delivery_date BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE services ADD COLUMN duration_days INT NULL;
ALTER TABLE services ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'BDT';
ALTER TABLE services MODIFY COLUMN delivery_start_date DATE NULL;
ALTER TABLE services MODIFY COLUMN delivery_end_date DATE NULL;

-- Invoice: Add renewedFromId for renewal tracking
ALTER TABLE invoices ADD COLUMN renewed_from_id INT NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_renewed_from FOREIGN KEY (renewed_from_id) REFERENCES invoices(id) ON DELETE SET NULL;
