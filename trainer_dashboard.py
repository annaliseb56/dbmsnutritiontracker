import streamlit as st
import psycopg2
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

# Page configuration
st.set_page_config(
    page_title="Personal Trainer Dashboard",
    page_icon="💪",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Database connection
@st.cache_resource
def get_connection():
    return psycopg2.connect(
        host="database-2.cobyak6mq07d.us-east-1.rds.amazonaws.com",
        database="postgres",
        user="postgres",
        password="dbmsNutrition2025!",
        port=5432
    )

@st.cache_data(ttl=300)
def run_query(query):
    """Run a query and return results as DataFrame"""
    conn = get_connection()
    try:
        df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        st.error(f"Query error: {e}")
        return pd.DataFrame()

# Title and header
st.title("💪 Personal Trainer Analytics Dashboard")
st.markdown("---")

# Date filter set to all time (no filter)
date_filter = ""

# ============================================================
# KEY METRICS ROW
# ============================================================
st.header("📈 Key Metrics Overview")
col1, col2, col3, col4 = st.columns(4)

# Total active users
total_users_query = f"""
    SELECT COUNT(DISTINCT user_key) as total_users
    FROM dim_user
    WHERE is_current = true
"""
total_users = run_query(total_users_query)

# Active users (tracked in last 30 days)
active_users_query = f"""
    SELECT COUNT(DISTINCT user_key) as active_users
    FROM (
        SELECT user_key FROM fact_progress fp
        JOIN dim_date dd ON fp.date_key = dd.date_key
        WHERE dd.full_date >= CURRENT_DATE - INTERVAL '30 days'
        UNION
        SELECT user_key FROM fact_workout fw
        JOIN dim_date dd ON fw.date_key = dd.date_key
        WHERE dd.full_date >= CURRENT_DATE - INTERVAL '30 days'
        UNION
        SELECT user_key FROM fact_nutrition fn
        JOIN dim_date dd ON fn.date_key = dd.date_key
        WHERE dd.full_date >= CURRENT_DATE - INTERVAL '30 days'
    ) all_activity
"""
active_users = run_query(active_users_query)

# Completed goals
completed_goals_query = f"""
    SELECT COUNT(*) as completed_goals
    FROM fact_goal_achievement
    WHERE goal_complete = true
"""
completed_goals = run_query(completed_goals_query)

# Average workout duration
avg_workout_query = f"""
    SELECT AVG(workout_duration_minutes) as avg_duration
    FROM fact_workout fw
    JOIN dim_date dd ON fw.date_key = dd.date_key
    WHERE 1=1 {date_filter}
"""
avg_workout = run_query(avg_workout_query)

with col1:
    st.metric("Total Users", f"{total_users['total_users'].values[0]:,}" if len(total_users) > 0 else "0")

with col2:
    st.metric("Active Users (30d)", f"{active_users['active_users'].values[0]:,}" if len(active_users) > 0 else "0")

with col3:
    st.metric("Completed Goals", f"{completed_goals['completed_goals'].values[0]:,}" if len(completed_goals) > 0 else "0")

with col4:
    avg_dur = avg_workout['avg_duration'].values[0] if len(avg_workout) > 0 and pd.notna(avg_workout['avg_duration'].values[0]) else 0
    st.metric("Avg Workout Duration", f"{avg_dur:.1f} min")

st.markdown("---")

# ============================================================
# GOAL COMPLETION & RETENTION ANALYSIS
# ============================================================
st.header("🎯 Goal Success & User Retention")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Time to Goal Completion Distribution")
    time_distribution_query = """
        WITH categorized AS (
            SELECT 
                CASE 
                    WHEN fga.days_to_complete < 30 THEN '< 30 days'
                    WHEN fga.days_to_complete < 60 THEN '30-60 days'
                    WHEN fga.days_to_complete < 90 THEN '60-90 days'
                    ELSE '> 90 days'
                END as completion_timeframe,
                CASE 
                    WHEN fga.days_to_complete < 30 THEN 1
                    WHEN fga.days_to_complete < 60 THEN 2
                    WHEN fga.days_to_complete < 90 THEN 3
                    ELSE 4
                END as sort_order
            FROM fact_goal_achievement fga
            WHERE fga.goal_complete = true
            AND fga.days_to_complete IS NOT NULL
        )
        SELECT 
            completion_timeframe,
            COUNT(*) as goal_count
        FROM categorized
        GROUP BY completion_timeframe, sort_order
        ORDER BY sort_order
    """
    time_distribution = run_query(time_distribution_query)
    
    if not time_distribution.empty:
        fig = px.bar(
            time_distribution,
            x='completion_timeframe',
            y='goal_count',
            text='goal_count',
            labels={'completion_timeframe': 'Time to Complete', 'goal_count': 'Number of Goals'}
        )
        fig.update_traces(
            texttemplate='%{text}', 
            textposition='outside',
            marker_color='#636EFA'
        )
        fig.update_layout(showlegend=False, height=400, margin=dict(t=50, b=50))
        st.plotly_chart(fig, use_container_width=True)
        
        # Show data table
        st.dataframe(time_distribution, use_container_width=True)
    else:
        st.info("No completed goal data available yet.")

with col2:
    st.subheader("Goal Completion by Activity Level")
    activity_completion_query = """
        WITH user_activity AS (
            SELECT 
                fw.user_key,
                COUNT(DISTINCT fw.date_key) as workout_days
            FROM fact_workout fw
            JOIN dim_date dd ON fw.date_key = dd.date_key
            WHERE dd.full_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY fw.user_key
        ),
        user_activity_level AS (
            SELECT 
                user_key,
                CASE 
                    WHEN workout_days >= 20 THEN 'High Activity (20+ days)'
                    WHEN workout_days >= 10 THEN 'Medium Activity (10-19 days)'
                    ELSE 'Low Activity (< 10 days)'
                END as activity_level
            FROM user_activity
        )
        SELECT 
            ual.activity_level,
            COUNT(*) as total_goals,
            SUM(CASE WHEN fga.goal_complete = true THEN 1 ELSE 0 END) as completed_goals,
            ROUND(100.0 * SUM(CASE WHEN fga.goal_complete = true THEN 1 ELSE 0 END) / COUNT(*), 1) as completion_rate
        FROM fact_goal_achievement fga
        LEFT JOIN user_activity_level ual ON fga.user_key = ual.user_key
        WHERE ual.activity_level IS NOT NULL
        GROUP BY ual.activity_level
        ORDER BY 
            CASE 
                WHEN ual.activity_level = 'High Activity (20+ days)' THEN 1
                WHEN ual.activity_level = 'Medium Activity (10-19 days)' THEN 2
                ELSE 3
            END
    """
    activity_completion = run_query(activity_completion_query)
    
    if not activity_completion.empty:
        fig = px.bar(
            activity_completion,
            x='activity_level',
            y='completion_rate',
            text='completion_rate',
            labels={'activity_level': 'Activity Level', 'completion_rate': 'Completion Rate (%)'}
        )
        fig.update_traces(
            texttemplate='%{text:.1f}%', 
            textposition='outside',
            marker_color='#00CC96'
        )
        fig.update_layout(showlegend=False, height=400, margin=dict(t=50, b=50))
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(activity_completion, use_container_width=True)
    else:
        st.info("No goal and workout data available yet.")

st.markdown("---")

# ============================================================
# WORKOUT EFFECTIVENESS ANALYSIS
# ============================================================
st.header("🏋️ Workout Effectiveness Analysis")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Most Popular Exercises")
    popular_exercises_query = f"""
        SELECT 
            de.exercise_type,
            COUNT(*) as workout_count,
            AVG(fw.exercise_duration_minutes) as avg_duration,
            SUM(fw.exercise_duration_minutes) as total_minutes
        FROM fact_workout fw
        JOIN dim_exercise de ON fw.exercise_key = de.exercise_key
        JOIN dim_date dd ON fw.date_key = dd.date_key
        WHERE 1=1 {date_filter}
        GROUP BY de.exercise_type
        ORDER BY workout_count DESC
        LIMIT 10
    """
    popular_exercises = run_query(popular_exercises_query)
    
    if not popular_exercises.empty:
        fig = px.bar(
            popular_exercises,
            x='workout_count',
            y='exercise_type',
            orientation='h',
            text='workout_count',
            labels={'workout_count': 'Number of Workouts', 'exercise_type': 'Exercise'},
            color='avg_duration',
            color_continuous_scale='Blues'
        )
        fig.update_traces(textposition='outside')
        fig.update_layout(height=400, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(popular_exercises, use_container_width=True)
    else:
        st.info("No workout data available yet.")

with col2:
    st.subheader("Exercise Adherence Rate")
    st.markdown("*Users who continue exercising after first workout*")
    
    adherence_query = f"""
        WITH user_workout_counts AS (
            SELECT 
                fw.user_key,
                de.exercise_type,
                COUNT(DISTINCT dd.full_date) as workout_days,
                MIN(dd.full_date) as first_workout,
                MAX(dd.full_date) as last_workout
            FROM fact_workout fw
            JOIN dim_exercise de ON fw.exercise_key = de.exercise_key
            JOIN dim_date dd ON fw.date_key = dd.date_key
            WHERE dd.full_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY fw.user_key, de.exercise_type
        )
        SELECT 
            exercise_type,
            COUNT(*) as total_users,
            AVG(workout_days) as avg_workout_days,
            SUM(CASE WHEN workout_days >= 5 THEN 1 ELSE 0 END) as committed_users,
            ROUND(100.0 * SUM(CASE WHEN workout_days >= 5 THEN 1 ELSE 0 END) / COUNT(*), 1) as adherence_rate
        FROM user_workout_counts
        GROUP BY exercise_type
        HAVING COUNT(*) >= 3
        ORDER BY adherence_rate DESC
        LIMIT 10
    """
    adherence = run_query(adherence_query)
    
    if not adherence.empty:
        fig = px.bar(
            adherence,
            x='exercise_type',
            y='adherence_rate',
            text='adherence_rate',
            labels={'exercise_type': 'Exercise', 'adherence_rate': 'Adherence Rate (%)'}
        )
        fig.update_traces(
            texttemplate='%{text:.1f}%', 
            textposition='outside',
            marker_color='#AB63FA'
        )
        fig.update_layout(height=400, showlegend=False, margin=dict(t=50, b=50))
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(adherence, use_container_width=True)
    else:
        st.info("Insufficient workout data for adherence analysis (need 90 days).")

st.markdown("---")

# ============================================================
# NUTRITION ANALYSIS
# ============================================================
st.header("🥗 Nutrition & Diet Effectiveness")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Most Common Foods in Successful Diets")
    st.markdown("*Foods consumed by users who completed weight-loss goals*")
    
    successful_foods_query = """
        WITH successful_users AS (
            SELECT DISTINCT fga.user_key
            FROM fact_goal_achievement fga
            JOIN dim_goal dg ON fga.goal_key = dg.goal_key
            WHERE fga.goal_complete = true
            AND dg.goal_type ILIKE '%weight%'
        )
        SELECT 
            df.description,
            COUNT(*) as consumption_count,
            AVG(fn.food_amount_grams) as avg_portion_size,
            AVG(df.calories_per_100g) as avg_calories
        FROM fact_nutrition fn
        JOIN dim_food df ON fn.food_key = df.food_key
        JOIN successful_users su ON fn.user_key = su.user_key
        GROUP BY df.description, df.calories_per_100g
        ORDER BY consumption_count DESC
        LIMIT 15
    """
    successful_foods = run_query(successful_foods_query)
    
    if not successful_foods.empty:
        fig = px.bar(
            successful_foods,
            x='consumption_count',
            y='description',
            orientation='h',
            text='consumption_count',
            labels={'consumption_count': 'Times Consumed', 'description': 'Food'},
            color='avg_calories',
            color_continuous_scale='RdYlGn_r'
        )
        fig.update_traces(textposition='outside')
        fig.update_layout(height=500, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No nutrition data available for successful users yet.")

with col2:
    st.subheader("Average Daily Nutrition Intake")
    
    daily_nutrition_query = f"""
        SELECT 
            dd.full_date,
            AVG(fn.total_calories) as avg_calories,
            AVG(fn.total_protein) as avg_protein,
            AVG(fn.total_carbs) as avg_carbs,
            AVG(fn.total_fat) as avg_fat
        FROM fact_nutrition fn
        JOIN dim_date dd ON fn.date_key = dd.date_key
        WHERE 1=1 {date_filter}
        GROUP BY dd.full_date
        ORDER BY dd.full_date
    """
    daily_nutrition = run_query(daily_nutrition_query)
    
    if not daily_nutrition.empty:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=daily_nutrition['full_date'], 
            y=daily_nutrition['avg_calories'],
            mode='lines+markers',
            name='Avg Calories',
            line=dict(color='orange', width=2)
        ))
        fig.update_layout(
            title='Average Daily Calorie Intake',
            xaxis_title='Date',
            yaxis_title='Calories',
            height=500,
            hovermode='x unified'
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Macro breakdown
        if len(daily_nutrition) > 0:
            avg_protein = daily_nutrition['avg_protein'].mean()
            avg_carbs = daily_nutrition['avg_carbs'].mean()
            avg_fat = daily_nutrition['avg_fat'].mean()
            
            st.markdown("**Average Macronutrient Breakdown:**")
            col_a, col_b, col_c = st.columns(3)
            col_a.metric("Protein", f"{avg_protein:.1f}g")
            col_b.metric("Carbs", f"{avg_carbs:.1f}g")
            col_c.metric("Fat", f"{avg_fat:.1f}g")
    else:
        st.info("No nutrition data available yet.")

st.markdown("---")

# ============================================================
# PROGRESS TRACKING & WEIGHT TRENDS
# ============================================================
st.header("📊 User Progress & Weight Trends")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Weight Change Distribution")
    
    weight_change_query = """
        WITH user_weight_change AS (
            SELECT 
                fp.user_key,
                (SELECT weight FROM fact_progress fp2 
                 WHERE fp2.user_key = fp.user_key AND fp2.weight IS NOT NULL 
                 ORDER BY fp2.date_key ASC LIMIT 1) as start_weight,
                (SELECT weight FROM fact_progress fp2 
                 WHERE fp2.user_key = fp.user_key AND fp2.weight IS NOT NULL 
                 ORDER BY fp2.date_key DESC LIMIT 1) as end_weight,
                COUNT(*) as tracking_count
            FROM fact_progress fp
            WHERE fp.weight IS NOT NULL
            GROUP BY fp.user_key
            HAVING COUNT(*) >= 2
        ),
        weight_diff AS (
            SELECT 
                user_key,
                start_weight,
                end_weight,
                end_weight - start_weight as weight_change
            FROM user_weight_change
        ),
        categorized AS (
            SELECT 
                CASE 
                    WHEN weight_change < -10 THEN 'Lost 10+ kg'
                    WHEN weight_change < -5 THEN 'Lost 5-10 kg'
                    WHEN weight_change < -2 THEN 'Lost 2-5 kg'
                    WHEN weight_change < 0 THEN 'Lost 0-2 kg'
                    WHEN weight_change = 0 THEN 'No change'
                    WHEN weight_change < 2 THEN 'Gained 0-2 kg'
                    WHEN weight_change < 5 THEN 'Gained 2-5 kg'
                    WHEN weight_change < 10 THEN 'Gained 5-10 kg'
                    ELSE 'Gained 10+ kg'
                END as weight_category,
                CASE 
                    WHEN weight_change < -10 THEN 1
                    WHEN weight_change < -5 THEN 2
                    WHEN weight_change < -2 THEN 3
                    WHEN weight_change < 0 THEN 4
                    WHEN weight_change = 0 THEN 5
                    WHEN weight_change < 2 THEN 6
                    WHEN weight_change < 5 THEN 7
                    WHEN weight_change < 10 THEN 8
                    ELSE 9
                END as sort_order
            FROM weight_diff
        )
        SELECT 
            weight_category,
            COUNT(*) as user_count
        FROM categorized
        GROUP BY weight_category, sort_order
        ORDER BY sort_order
    """
    weight_change = run_query(weight_change_query)
    
    if not weight_change.empty:
        fig = px.pie(
            weight_change,
            values='user_count',
            names='weight_category',
            hole=0.4,
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(weight_change, use_container_width=True)
    else:
        st.info("Insufficient progress tracking data (need multiple entries per user).")

with col2:
    st.subheader("Average BMI Trends")
    
    bmi_trend_query = f"""
        SELECT 
            dd.full_date,
            AVG(fp.bmi) as avg_bmi,
            COUNT(DISTINCT fp.user_key) as users_tracked
        FROM fact_progress fp
        JOIN dim_date dd ON fp.date_key = dd.date_key
        WHERE fp.bmi IS NOT NULL
        AND dd.full_date >= CURRENT_DATE - INTERVAL '180 days'
        GROUP BY dd.full_date
        ORDER BY dd.full_date
    """
    bmi_trend = run_query(bmi_trend_query)
    
    if not bmi_trend.empty:
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=bmi_trend['full_date'],
            y=bmi_trend['avg_bmi'],
            mode='lines+markers',
            name='Avg BMI',
            line=dict(color='blue', width=2),
            fill='tozeroy'
        ))
        
        # Add BMI category reference lines
        fig.add_hline(y=18.5, line_dash="dash", line_color="gray", annotation_text="Underweight")
        fig.add_hline(y=25, line_dash="dash", line_color="orange", annotation_text="Overweight")
        fig.add_hline(y=30, line_dash="dash", line_color="red", annotation_text="Obese")
        
        fig.update_layout(
            title='Average BMI Over Time',
            xaxis_title='Date',
            yaxis_title='BMI',
            height=400,
            hovermode='x unified'
        )
        st.plotly_chart(fig, use_container_width=True)
        
        current_bmi = bmi_trend['avg_bmi'].iloc[-1] if len(bmi_trend) > 0 else 0
        st.metric("Current Average BMI", f"{current_bmi:.1f}")
    else:
        st.info("No BMI tracking data available yet.")

st.markdown("---")

# ============================================================
# USER ENGAGEMENT & ACTIVITY
# ============================================================
st.header("👥 User Engagement & Activity Patterns")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Workout Frequency by Day of Week")
    
    dow_query = f"""
        SELECT 
            dd.day_of_week,
            COUNT(*) as workout_count,
            COUNT(DISTINCT fw.user_key) as unique_users
        FROM fact_workout fw
        JOIN dim_date dd ON fw.date_key = dd.date_key
        WHERE 1=1 {date_filter}
        GROUP BY dd.day_of_week
        ORDER BY 
            CASE dd.day_of_week
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                WHEN 'Sunday' THEN 7
            END
    """
    dow_workouts = run_query(dow_query)
    
    if not dow_workouts.empty:
        fig = px.bar(
            dow_workouts,
            x='day_of_week',
            y=['workout_count', 'unique_users'],
            barmode='group',
            labels={'value': 'Count', 'day_of_week': 'Day of Week'},
            color_discrete_sequence=['#636EFA', '#EF553B']
        )
        fig.update_layout(height=400, legend_title_text='Metric')
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No workout data available yet.")

with col2:
    st.subheader("User Retention Rate")
    st.markdown("*Percentage of users still active after first activity*")
    
    retention_query = """
        WITH first_activity AS (
            SELECT 
                user_key,
                MIN(date_key) as first_date
            FROM (
                SELECT user_key, date_key FROM fact_workout
                UNION ALL
                SELECT user_key, date_key FROM fact_nutrition
                UNION ALL
                SELECT user_key, date_key FROM fact_progress
            ) combined
            GROUP BY user_key
        ),
        last_activity AS (
            SELECT 
                user_key,
                MAX(date_key) as last_date
            FROM (
                SELECT user_key, date_key FROM fact_workout
                UNION ALL
                SELECT user_key, date_key FROM fact_nutrition
                UNION ALL
                SELECT user_key, date_key FROM fact_progress
            ) combined
            GROUP BY user_key
        )
        SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN la.last_date >= TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYYMMDD')::int THEN 1 ELSE 0 END) as active_7d,
            SUM(CASE WHEN la.last_date >= TO_CHAR(CURRENT_DATE - INTERVAL '30 days', 'YYYYMMDD')::int THEN 1 ELSE 0 END) as active_30d,
            SUM(CASE WHEN la.last_date >= TO_CHAR(CURRENT_DATE - INTERVAL '90 days', 'YYYYMMDD')::int THEN 1 ELSE 0 END) as active_90d
        FROM first_activity fa
        JOIN last_activity la ON fa.user_key = la.user_key
    """
    retention = run_query(retention_query)
    
    if not retention.empty and retention['total_users'].values[0] > 0:
        total = retention['total_users'].values[0]
        retention_data = pd.DataFrame({
            'Period': ['7 Days', '30 Days', '90 Days'],
            'Active Users': [
                retention['active_7d'].values[0],
                retention['active_30d'].values[0],
                retention['active_90d'].values[0]
            ],
            'Retention Rate': [
                100 * retention['active_7d'].values[0] / total,
                100 * retention['active_30d'].values[0] / total,
                100 * retention['active_90d'].values[0] / total
            ]
        })
        
        fig = px.bar(
            retention_data,
            x='Period',
            y='Retention Rate',
            text='Retention Rate',
            labels={'Retention Rate': 'Retention Rate (%)'}
        )
        fig.update_traces(
            texttemplate='%{text:.1f}%', 
            textposition='outside',
            marker_color='#EF553B'
        )
        fig.update_layout(height=400, showlegend=False, margin=dict(t=50, b=50))
        st.plotly_chart(fig, use_container_width=True)
        
        st.dataframe(retention_data, use_container_width=True)
    else:
        st.info("No activity data available for retention analysis.")

st.markdown("---")

# ============================================================
# ACTIONABLE INSIGHTS
# ============================================================
st.header("💡 Actionable Insights for Trainers")

insights_col1, insights_col2 = st.columns(2)

with insights_col1:
    st.subheader("🔴 Users at Risk of Dropping Out")
    
    at_risk_query = """
        WITH last_activity AS (
            SELECT 
                fw.user_key,
                MAX(dd.full_date) as last_workout_date,
                COUNT(*) as total_workouts
            FROM fact_workout fw
            JOIN dim_date dd ON fw.date_key = dd.date_key
            GROUP BY fw.user_key
        )
        SELECT 
            du.username,
            la.last_workout_date,
            la.total_workouts,
            CURRENT_DATE - la.last_workout_date as days_inactive
        FROM last_activity la
        JOIN dim_user du ON la.user_key = du.user_key
        WHERE la.last_workout_date < CURRENT_DATE - INTERVAL '14 days'
        AND la.last_workout_date >= CURRENT_DATE - INTERVAL '60 days'
        ORDER BY la.last_workout_date
        LIMIT 10
    """
    at_risk = run_query(at_risk_query)
    
    if not at_risk.empty:
        st.dataframe(at_risk, use_container_width=True)
        st.markdown(f"**{len(at_risk)} users** haven't worked out in 14+ days")
    else:
        st.success("No users at risk! All users are active.")

with insights_col2:
    st.subheader("⭐ Top Performing Users")
    
    top_performers_query = """
        WITH base_user_workouts AS (
            SELECT 
                SUBSTRING(du.username FROM '^[^_]+_[^_]+') as base_username,
                fw.date_key,
                fw.workout_duration_minutes,
                de.exercise_type
            FROM fact_workout fw
            JOIN dim_exercise de ON fw.exercise_key = de.exercise_key
            JOIN dim_date dd ON fw.date_key = dd.date_key
            JOIN dim_user du ON fw.user_key = du.user_key
            WHERE dd.full_date >= CURRENT_DATE - INTERVAL '30 days'
            AND du.is_current = true
        )
        SELECT 
            base_username as username,
            COUNT(DISTINCT date_key) as workout_days,
            ROUND(AVG(workout_duration_minutes), 1) as avg_duration_min,
            COUNT(DISTINCT exercise_type) as exercise_variety
        FROM base_user_workouts
        GROUP BY base_username
        ORDER BY workout_days DESC, exercise_variety DESC
        LIMIT 10
    """
    top_performers = run_query(top_performers_query)
    
    if not top_performers.empty:
        st.dataframe(top_performers, use_container_width=True)
        st.markdown(f"**Top {len(top_performers)} users** by workout consistency (last 30 days)")
    else:
        st.info("No workout data available for the last 30 days.")

# Footer
st.markdown("---")
st.markdown("**Personal Trainer Dashboard** | Built with Streamlit")
