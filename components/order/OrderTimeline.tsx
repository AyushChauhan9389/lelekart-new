/** @jsxImportSource react */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CheckCircle2, Package, Truck, ClipboardCheck, XCircle, Circle } from 'lucide-react-native'; // Added Circle for pending

interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  date?: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isCancelled?: boolean;
  colors: typeof Colors.light;
}

const TimelineStep: React.FC<TimelineStepProps> = ({
  icon,
  title,
  date,
  description,
  isActive,
  isCompleted,
  isFirst = false,
  isLast = false,
  isCancelled = false,
  colors,
}) => {
  const activeColor = isCancelled ? colors.error : colors.primary;
  const dotColor = isActive || isCompleted ? activeColor : colors.border;
  const lineColor = isCompleted ? activeColor : colors.border;
  const titleColor = isActive || isCompleted ? (isCancelled ? colors.error : colors.text) : colors.textSecondary;
  const dateColor = isActive || isCompleted ? (isCancelled ? colors.textSecondary : colors.text) : colors.textSecondary; // Changed errorMuted to textSecondary
  const descriptionColor = colors.textSecondary;

  return (
    <View style={styles.stepContainer}>
      {!isFirst && <View style={[styles.line, { backgroundColor: lineColor, top: 0, bottom: '50%' }]} />}
      {!isLast && <View style={[styles.line, { backgroundColor: lineColor, top: '50%', bottom: 0 }]} />}
      
      <View style={[styles.dot, { backgroundColor: dotColor }]}>
        {React.cloneElement(icon as React.ReactElement, {
          color: isActive || isCompleted ? colors.background : colors.textSecondary,
          size: 14,
        })}
      </View>
      <View style={styles.contentContainer}>
        <ThemedText style={[styles.title, { color: titleColor }]}>{title}</ThemedText>
        {date && <ThemedText style={[styles.date, { color: dateColor }]}>{date}</ThemedText>}
        {description && <ThemedText style={[styles.description, { color: descriptionColor }]}>{description}</ThemedText>}
      </View>
    </View>
  );
};

interface OrderTimelineProps {
  status: string;
  createdAt?: string;
  // Specific date props for each status could be added here if available from the Order type
  // e.g., processingAt?: string; shippedAt?: string; deliveredAt?: string; cancelledAt?: string;
  // For now, we'll rely on createdAt for "Placed" and imply other dates or leave them blank.
  // We can also pass estimatedDeliveryDate from the Order object if available.
  estimatedDeliveryDate?: string; 
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, estimatedDeliveryDate }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return undefined;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const orderStatusHierarchy: { [key: string]: number } = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 5, // Special case
  };

  const currentStatusIndex = orderStatusHierarchy[status?.toLowerCase()] ?? -1;
  const isCancelledOrder = status?.toLowerCase() === 'cancelled';

  const timelineSteps = [
    {
      key: 'placed',
      title: 'Order Placed',
      icon: <ClipboardCheck />, // Using ClipboardCheck as a generic "task done" for placed
      date: formatDate(createdAt),
      description: isCancelledOrder && currentStatusIndex < 1 ? 'Order was cancelled' : undefined,
    },
    {
      key: 'processing',
      title: 'Processing',
      icon: <Package />,
      description: isCancelledOrder && currentStatusIndex < 2 ? 'Order was cancelled before processing' : (currentStatusIndex === 1 || currentStatusIndex === 2 ? `Your order is being ${status.toLowerCase()}` : 'Waiting for processing'),
      // Date for processing would ideally come from a specific 'processingAt' field
      date: (currentStatusIndex === 1 || currentStatusIndex === 2) && !isCancelledOrder ? formatDate(createdAt) : undefined, // Fallback to createdAt or leave undefined
    },
    {
      key: 'shipped',
      title: 'Shipping',
      icon: <Truck />,
      description: isCancelledOrder && currentStatusIndex < 3 ? 'Order was cancelled before shipping' : (currentStatusIndex === 3 ? 'Your order is on its way' : 'Awaiting shipment'),
      // Date for shipping would ideally come from a specific 'shippedAt' field
      date: currentStatusIndex === 3 && !isCancelledOrder ? formatDate(createdAt) : undefined, // Fallback to createdAt or leave undefined
    },
    {
      key: 'delivered',
      title: 'Delivery',
      icon: <ClipboardCheck />,
      description: isCancelledOrder ? 'Order was cancelled' : (currentStatusIndex === 4 ? 'Your order has been delivered' : `Expected by: ${formatDate(estimatedDeliveryDate) || 'pending'}`),
      // Date for delivery would ideally come from a specific 'deliveredAt' field
      date: currentStatusIndex === 4 && !isCancelledOrder ? formatDate(createdAt) : undefined, // Fallback to createdAt or use estimatedDeliveryDate if status is not yet delivered
    },
  ];
  
  if (isCancelledOrder) {
    // If cancelled, only show relevant steps up to cancellation point or a single "Cancelled" step
    // For simplicity, we'll mark all steps as "cancelled" in appearance if the order is cancelled.
    return (
      <View style={[styles.container, {backgroundColor: colors.surface}]}>
        <ThemedText type="subtitle" style={[styles.timelineTitle, {color: colors.text}]}>Order Timeline</ThemedText>
        <TimelineStep
          icon={<XCircle />}
          title="Order Cancelled"
          date={formatDate(createdAt)} // Use createdAt as the cancellation date if no specific cancelledAt is available
          description="This order has been cancelled."
          isActive={true}
          isCompleted={true}
          isCancelled={true}
          colors={colors}
          isFirst
          isLast
        />
      </View>
    );
  }


  return (
    <View style={[styles.container, {backgroundColor: colors.surface}]}>
       <ThemedText type="subtitle" style={[styles.timelineTitle, {color: colors.text}]}>Order Timeline</ThemedText>
      {timelineSteps.map((step, index) => {
        const stepStatusIndex = orderStatusHierarchy[step.key === 'placed' ? 'pending' : step.key]; // 'placed' maps to 'pending' for hierarchy check
        const isActive = currentStatusIndex === stepStatusIndex;
        const isCompleted = currentStatusIndex > stepStatusIndex;
        
        return (
          <TimelineStep
            key={step.key}
            icon={isActive || isCompleted ? step.icon : <Circle />} // Show pending icon if not active/completed
            title={step.title}
            // For active steps, if step.date is not set (e.g. for processing/shipped without specific dates), it will be undefined.
            // 'Order Placed' will always have its date from createdAt.
            // 'Delivered' step might use estimatedDeliveryDate in its description if not yet delivered.
            date={isActive || isCompleted ? step.date : undefined}
            description={step.description}
            isActive={isActive}
            isCompleted={isCompleted}
            isFirst={index === 0}
            isLast={index === timelineSteps.length - 1}
            colors={colors}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  timelineTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: 24, // Space between steps
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1, // Ensure dot is above the line
    borderWidth: 2,
    borderColor: 'transparent', // Will be colored by icon background or dot itself
  },
  line: {
    position: 'absolute',
    left: 13, // Center of the dot (28/2 - 1)
    width: 2,
    zIndex: 0, // Line behind the dot
  },
  contentContainer: {
    flex: 1,
    paddingTop: 2, // Align text nicely with the dot
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
  },
});
