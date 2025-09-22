-- Create function to automatically sync van data when driver details change
CREATE OR REPLACE FUNCTION public.sync_van_on_driver_update()
RETURNS TRIGGER AS $$
DECLARE
  _school_id UUID;
  _existing_van_id UUID;
BEGIN
  -- Get the school_id for this driver
  SELECT ur.school_id INTO _school_id
  FROM user_roles ur 
  WHERE ur.user_id = NEW.user_id AND ur.role = 'driver'
  LIMIT 1;
  
  -- If no school assigned, skip
  IF _school_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- If van_assigned is provided, create/update van record
  IF NEW.van_assigned IS NOT NULL AND NEW.van_assigned != '' THEN
    
    -- Check if van already exists
    SELECT id INTO _existing_van_id
    FROM public.vans 
    WHERE van_number = NEW.van_assigned;
    
    IF _existing_van_id IS NULL THEN
      -- Create new van
      INSERT INTO public.vans (
        van_number,
        school_id,
        driver_id,
        route_name,
        capacity,
        status,
        current_students
      ) VALUES (
        NEW.van_assigned,
        _school_id,
        NEW.user_id,
        NEW.route_assigned,
        30, -- default capacity
        'active',
        0
      );
      
      -- Update school's total_vans count
      UPDATE public.schools 
      SET total_vans = total_vans + 1
      WHERE id = _school_id;
      
    ELSE
      -- Update existing van
      UPDATE public.vans 
      SET 
        driver_id = NEW.user_id,
        route_name = NEW.route_assigned,
        school_id = _school_id,
        status = 'active'
      WHERE id = _existing_van_id;
    END IF;
    
  END IF;
  
  -- If van_assigned was removed or changed, clean up old assignment
  IF OLD.van_assigned IS NOT NULL AND OLD.van_assigned != '' AND 
     (NEW.van_assigned IS NULL OR NEW.van_assigned = '' OR NEW.van_assigned != OLD.van_assigned) THEN
    
    -- Remove driver assignment from old van
    UPDATE public.vans 
    SET driver_id = NULL, status = 'inactive'
    WHERE van_number = OLD.van_assigned AND driver_id = NEW.user_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run the sync function
DROP TRIGGER IF EXISTS sync_van_on_driver_details_update ON public.driver_details;
CREATE TRIGGER sync_van_on_driver_details_update
  AFTER INSERT OR UPDATE ON public.driver_details
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_van_on_driver_update();

-- Also create a function to clean up when driver is deleted
CREATE OR REPLACE FUNCTION public.cleanup_van_on_driver_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove driver assignment and deactivate van
  UPDATE public.vans 
  SET driver_id = NULL, status = 'inactive'
  WHERE driver_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for driver cleanup
DROP TRIGGER IF EXISTS cleanup_van_on_driver_delete ON public.driver_details;
CREATE TRIGGER cleanup_van_on_driver_delete
  AFTER DELETE ON public.driver_details
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_van_on_driver_delete();