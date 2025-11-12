/**
 * DateCell
 * Displays formatted date
 */

import React from 'react';
import { formatDate } from '../../utils/formatters';

export default function DateCell({ date }) {
  return <span>{formatDate(date)}</span>;
}
