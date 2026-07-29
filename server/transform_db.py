import pandas as pd


def add_categoria(df, df_param):
    df['Categoria'] = df['Local'].map(
        df_param.set_index('Local')['Categoria']
    ).fillna('Extra')
    return df


def add_categoria_geral(df, df_param):
    df['Categoria Geral'] = df['Local'].map(
        df_param.set_index('Local')['Categoria Geral']
    ).fillna('Extra')
    return df


def add_mes(df):
    df['Mês'] = df['Data'].dt.strftime('%Y-%m')
    return df


def prepare_data(df, df_param):
    df['Data'] = pd.to_datetime(df['Data'], format='mixed')

    df = add_categoria(df, df_param)
    df = add_categoria_geral(df, df_param)
    df = add_mes(df)

    return df
