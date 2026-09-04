const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getReportDateRange = (
  period = "THIS_MONTH",
  fromDate,
  toDate
) => {
  const now = new Date();

  let from;
  let to;

  switch (period) {
    case "TODAY":
      from = startOfDay(now);
      to = endOfDay(now);
      break;

    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      from = startOfDay(yesterday);
      to = endOfDay(yesterday);
      break;
    }

    case "THIS_WEEK": {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      from = new Date(now);
      from.setDate(now.getDate() + diff);
      from = startOfDay(from);

      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to = endOfDay(to);
      break;
    }

    case "LAST_WEEK": {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() + diff);

      from = new Date(thisWeekStart);
      from.setDate(from.getDate() - 7);
      from = startOfDay(from);

      to = new Date(thisWeekStart);
      to.setDate(to.getDate() - 1);
      to = endOfDay(to);
      break;
    }

    case "THIS_MONTH":
      from = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );

      to = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;

    case "LAST_MONTH":
      from = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
        0
      );

      to = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999
      );
      break;

    case "THIS_QUARTER": {
      const quarterStartMonth =
        Math.floor(now.getMonth() / 3) * 3;

      from = new Date(
        now.getFullYear(),
        quarterStartMonth,
        1,
        0,
        0,
        0,
        0
      );

      to = new Date(
        now.getFullYear(),
        quarterStartMonth + 3,
        0,
        23,
        59,
        59,
        999
      );
      break;
    }

    case "LAST_QUARTER": {
      const currentQuarter =
        Math.floor(now.getMonth() / 3);

      const quarterStartMonth =
        (currentQuarter - 1) * 3;

      if (currentQuarter === 0) {
        from = new Date(
          now.getFullYear() - 1,
          9,
          1,
          0,
          0,
          0,
          0
        );

        to = new Date(
          now.getFullYear() - 1,
          12,
          0,
          23,
          59,
          59,
          999
        );
      } else {
        from = new Date(
          now.getFullYear(),
          quarterStartMonth,
          1,
          0,
          0,
          0,
          0
        );

        to = new Date(
          now.getFullYear(),
          quarterStartMonth + 3,
          0,
          23,
          59,
          59,
          999
        );
      }
      break;
    }

    case "THIS_YEAR":
      from = new Date(
        now.getFullYear(),
        0,
        1,
        0,
        0,
        0,
        0
      );

      to = new Date(
        now.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999
      );
      break;

    case "LAST_YEAR":
      from = new Date(
        now.getFullYear() - 1,
        0,
        1,
        0,
        0,
        0,
        0
      );

      to = new Date(
        now.getFullYear() - 1,
        11,
        31,
        23,
        59,
        59,
        999
      );
      break;

    case "ALL":
      from = new Date(2000, 0, 1, 0, 0, 0, 0);
      to = new Date(2099, 11, 31, 23, 59, 59, 999);
      break;

    case "CUSTOM":
      if (!fromDate || !toDate) {
        throw new Error(
          "Please select both From Date and To Date."
        );
      }

      from = startOfDay(fromDate);
      to = endOfDay(toDate);

      if (from > to) {
        throw new Error(
          "From Date cannot be greater than To Date."
        );
      }
      break;

    default:
      // Default to this month
      from = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );
      to = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
  }

  return {
    fromDate: from,
    toDate: to,
  };
};