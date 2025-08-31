-- Add booking constraints and capacity management
-- This migration adds proper constraints for booking capacity management

-- Create function to check booking capacity
CREATE OR REPLACE FUNCTION check_booking_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_bookings INTEGER;
    schedule_capacity INTEGER;
BEGIN
    -- Get the schedule capacity
    SELECT capacity INTO schedule_capacity
    FROM schedules
    WHERE id = NEW.schedule_id;
    
    -- Count current bookings for this schedule
    SELECT COUNT(*) INTO current_bookings
    FROM bookings
    WHERE schedule_id = NEW.schedule_id
    AND status != 'cancelled';
    
    -- Check if adding this booking would exceed capacity
    IF current_bookings >= schedule_capacity THEN
        RAISE EXCEPTION 'Schedule is at full capacity. Cannot create new booking.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking capacity check
DROP TRIGGER IF EXISTS check_booking_capacity_trigger ON bookings;
CREATE TRIGGER check_booking_capacity_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    WHEN (NEW.schedule_id IS NOT NULL)
    EXECUTE FUNCTION check_booking_capacity();

-- Create function to update schedule booked count
CREATE OR REPLACE FUNCTION update_schedule_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update schedule booked count when booking is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE schedules 
        SET booked_count = booked_count + 1
        WHERE id = NEW.schedule_id;
        RETURN NEW;
    END IF;
    
    -- Update schedule booked count when booking is deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE schedules 
        SET booked_count = booked_count - 1
        WHERE id = OLD.schedule_id;
        RETURN OLD;
    END IF;
    
    -- Update schedule booked count when booking is updated
    IF TG_OP = 'UPDATE' THEN
        -- If schedule changed, update both old and new schedules
        IF OLD.schedule_id != NEW.schedule_id THEN
            UPDATE schedules 
            SET booked_count = booked_count - 1
            WHERE id = OLD.schedule_id;
            
            UPDATE schedules 
            SET booked_count = booked_count + 1
            WHERE id = NEW.schedule_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating schedule booked count
DROP TRIGGER IF EXISTS update_schedule_booked_count_trigger ON bookings;
CREATE TRIGGER update_schedule_booked_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_booked_count();

-- Add constraint to ensure schedule_id exists when provided
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_schedule_id') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_schedule_id FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add constraint to ensure client_id exists when provided
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_client_id') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add constraint to ensure user_package_id exists when provided
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_user_package_id') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_package_id FOREIGN KEY (user_package_id) REFERENCES user_packages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add constraint to ensure package_id exists when provided
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_package_id') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_package_id FOREIGN KEY (package_id) REFERENCES soul_packages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add constraint to ensure currency_id exists when provided
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_currency_id') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_currency_id FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add constraint to ensure group_booking_tier_id exists when provided
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_group_booking_tier_id') THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_group_booking_tier_id FOREIGN KEY (group_booking_tier_id) REFERENCES group_booking_tiers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraint for booking status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_booking_status') THEN
        ALTER TABLE bookings ADD CONSTRAINT check_booking_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));
    END IF;
END $$;

-- Add check constraint for booking type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_booking_type') THEN
        ALTER TABLE bookings ADD CONSTRAINT check_booking_type CHECK (booking_type IN ('individual', 'group'));
    END IF;
END $$;

-- Add check constraint for group size
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_group_size') THEN
        ALTER TABLE bookings ADD CONSTRAINT check_group_size CHECK (group_size >= 1);
    END IF;
END $$;

-- Add check constraint for amounts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_amounts') THEN
        ALTER TABLE bookings ADD CONSTRAINT check_amounts CHECK (total_amount >= 0 AND discount_amount >= 0 AND final_amount >= 0);
    END IF;
END $$;

-- Update existing schedules to have proper capacity
UPDATE schedules SET capacity = 5 WHERE capacity < 5;

-- Reset booked count for existing schedules
UPDATE schedules SET booked_count = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE bookings.schedule_id = schedules.id 
    AND bookings.status != 'cancelled'
);

-- Add comment to document the constraints
COMMENT ON FUNCTION check_booking_capacity() IS 'Function to check if a schedule has available capacity for new bookings';
COMMENT ON FUNCTION update_schedule_booked_count() IS 'Function to update schedule booked count when bookings are modified';
COMMENT ON TRIGGER check_booking_capacity_trigger ON bookings IS 'Trigger to check booking capacity before insertion';
COMMENT ON TRIGGER update_schedule_booked_count_trigger ON bookings IS 'Trigger to update schedule booked count when bookings are modified';
