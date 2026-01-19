//这个是后台api地址访问地址是：jnr-api.lvxin.xn--6qq986b3xl
// worker.js - 使用新Worker URL和jnr_db数据库
// worker.js - 管理员登录API实现
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 头部（增加 Authorization 支持并返回正确的预检响应）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // 确保表包含 created_at / updated_at 列（兼容旧表结构）
      async function ensureColumn(table, column, definition) {
        try {
          const { results } = await env.jnr_db.prepare(`PRAGMA table_info(${table})`).all();
          const cols = results.map(r => r.name);
          if (!cols.includes(column)) {
            await env.jnr_db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
            console.log(`Migrated: added ${column} to ${table}`);
          }
        } catch (err) {
          console.error(`ensureColumn ${table}.${column} failed:`, err);
        }
      }

      // 在每次请求时安全检测并按需添加列（操作幂等）
      await ensureColumn('admin_users', 'created_at', "TEXT DEFAULT CURRENT_TIMESTAMP");
      await ensureColumn('admin_users', 'updated_at', "TEXT DEFAULT CURRENT_TIMESTAMP");
      await ensureColumn('couples', 'updated_at', "TEXT DEFAULT CURRENT_TIMESTAMP");

      // 获取所有情侣数据
      if (path === '/api/data' && request.method === 'GET') {
        const { results } = await env.jnr_db.prepare(
          `SELECT id, male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary FROM couples ORDER BY id`
        ).all();
        
        // 转换数据格式以兼容现有前端
        const formattedData = results.map(row => ({
          id: row.id,
          male: {
            name: row.male_name,
            qq: row.male_qq,
            birth: row.male_birth
          },
          female: {
            name: row.female_name,
            qq: row.female_qq,
            birth: row.female_birth
          },
          anniversary: row.anniversary
        }));
        
        return new Response(JSON.stringify(formattedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
	  
	   // 根据ID获取单个情侣数据
      if (path.startsWith('/api/data/') && request.method === 'GET') {
        const id = parseInt(path.split('/')[3]);
        const { results } = await env.jnr_db.prepare(
          `SELECT id, male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary FROM couples WHERE id = ?`
        ).bind(id).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: '未找到对应情侣信息' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // 转换数据格式以兼容现有前端
        const row = results[0];
        const formattedData = {
          id: row.id,
          male: {
            name: row.male_name,
            qq: row.male_qq,
            birth: row.male_birth
          },
          female: {
            name: row.female_name,
            qq: row.female_qq,
            birth: row.female_birth
          },
          anniversary: row.anniversary
        };
        
        return new Response(JSON.stringify(formattedData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
	  
	  
      // 添加情侣数据
      if (path === '/api/add' && request.method === 'POST') {
        const password = url.searchParams.get('password');
        if (password !== 'xiaozhou') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const body = await request.json();
        
        const stmt = env.jnr_db.prepare(
          `INSERT INTO couples (male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        
        const result = await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          id: result.meta.last_row_id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 更新情侣数据
      if (path.startsWith('/api/update/') && request.method === 'PUT') {
        const id = parseInt(path.split('/')[3]);
        const password = url.searchParams.get('password');
        if (password !== 'xiaozhou') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const body = await request.json();
        
        const stmt = env.jnr_db.prepare(
          `UPDATE couples 
           SET male_name = ?, male_qq = ?, male_birth = ?, 
               female_name = ?, female_qq = ?, female_birth = ?, 
               anniversary = ?
           WHERE id = ?`
        );
        
        await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary,
          id
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 删除情侣数据
      if (path.startsWith('/api/delete/') && request.method === 'DELETE') {
        const id = parseInt(path.split('/')[3]);
        const password = url.searchParams.get('password');
        if (password !== 'xiaozhou') {
          return new Response(JSON.stringify({ error: '认证失败' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const stmt = env.jnr_db.prepare(`DELETE FROM couples WHERE id = ?`);
        await stmt.bind(id).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 添加情侣数据（管理员）
      if (path === '/api/adds' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        const payload = verifyAdminToken(authHeader);
        if (!payload) {
          return new Response(JSON.stringify({ error: '未提供有效的认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const body = await request.json();
        const stmt = env.jnr_db.prepare(
          `INSERT INTO couples (male_name, male_qq, male_birth, female_name, female_qq, female_birth, anniversary) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        const result = await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary
        ).run();

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 更新情侣数据（管理员）
      if (path.startsWith('/api/updates/') && request.method === 'PUT') {
        const authHeader = request.headers.get('Authorization');
        const payload = verifyAdminToken(authHeader);
        if (!payload) {
          return new Response(JSON.stringify({ error: '未提供有效的认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const id = parseInt(path.split('/')[3]);
        const body = await request.json();
        const stmt = env.jnr_db.prepare(
          `UPDATE couples 
           SET male_name = ?, male_qq = ?, male_birth = ?, 
               female_name = ?, female_qq = ?, female_birth = ?, 
               anniversary = ?
           WHERE id = ?`
        );
        await stmt.bind(
          body.male.name,
          body.male.qq,
          body.male.birth,
          body.female.name,
          body.female.qq,
          body.female.birth,
          body.anniversary,
          id
        ).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 删除情侣数据（管理员）
      if (path.startsWith('/api/deletes/') && request.method === 'DELETE') {
        const authHeader = request.headers.get('Authorization');
        const payload = verifyAdminToken(authHeader);
        if (!payload) {
          return new Response(JSON.stringify({ error: '未提供有效的认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const id = parseInt(path.split('/')[3]);
        const stmt = env.jnr_db.prepare(`DELETE FROM couples WHERE id = ?`);
        await stmt.bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 简单的密码哈希函数（用于演示，实际应用建议使用更安全的算法）
      async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }

      // 验证密码哈希
      async function verifyPassword(plainPassword, hashedPassword) {
        const hash = await hashPassword(plainPassword);
        return hash === hashedPassword;
      }

      // 生成JWT token（简单实现）
      function generateToken(username, adminId) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ 
          username,
          adminId,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24小时过期
        }));
        const signature = btoa(`${header}.${payload}.secret_key`);
        return `${header}.${payload}.${signature}`;
      }

      // 验证管理员 token（与 generateToken 配套）
      function verifyAdminToken(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        const token = authHeader.substring(7);
        try {
          const parts = token.split('.');
          if (parts.length !== 3) return null;
          const expectedSig = btoa(`${parts[0]}.${parts[1]}.secret_key`);
          if (parts[2] !== expectedSig) return null;
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) return null;
          return payload; // 返回 payload 供业务使用
        } catch (e) {
          console.error('verifyAdminToken error:', e);
          return null;
        }
      }

      // 管理员登录验证
      if (path === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        
        if (!username || !password) {
          return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const stmt = env.jnr_db.prepare(
            `SELECT id, username, password_hash FROM admin_users WHERE username = ?`
          );
          const result = await stmt.bind(username).first();
          
          if (!result) {
            return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          const stored = result.password_hash || '';
          let isPasswordValid = false;

          // 判断是否为 SHA-256 十六进制哈希（长度64）
          const sha256Regex = /^[0-9a-f]{64}$/i;

          if (sha256Regex.test(stored)) {
            // 已是哈希，正常验证
            isPasswordValid = await verifyPassword(password, stored);
          } else {
            // 兼容：数据库里可能存的是明文（迁移场景）
            if (password === stored) {
              isPasswordValid = true;
              // 尝试将明文迁移为哈希写回数据库（非阻塞登录流程）
              try {
                const newHash = await hashPassword(password);
                await env.jnr_db.prepare(
                  `UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                ).bind(newHash, result.id).run();
              } catch (migErr) {
                console.error('password migration failed:', migErr);
              }
            }
          }
          
          if (!isPasswordValid) {
            return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          const token = generateToken(result.username, result.id);
          
          return new Response(JSON.stringify({ 
            success: true,
            token: token,
            username: result.username
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Login error:', error);
          return new Response(JSON.stringify({ error: '登录处理失败：' + error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 修改管理员密码接口（兼容数据库中明文密码）
      if (path === '/api/change-password' && request.method === 'POST') {
        // 验证管理员身份
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未提供有效的认证信息' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          const token = authHeader.substring(7);
          const parts = token.split('.');
          if (parts.length !== 3) {
            throw new Error('无效的token格式');
          }
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp < now) {
            return new Response(JSON.stringify({ error: 'Token已过期' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const body = await request.json();
          const { oldPassword, newPassword } = body;

          if (!oldPassword || !newPassword) {
            return new Response(JSON.stringify({ error: '旧密码和新密码不能为空' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // 从数据库获取用户（以 payload.username 为准）
          const stmt = env.jnr_db.prepare(
            `SELECT id, username, password_hash FROM admin_users WHERE username = ?`
          );
          const user = await stmt.bind(payload.username).first();

          if (!user) {
            return new Response(JSON.stringify({ error: '用户不存在' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const stored = user.password_hash || '';
          let isOldPasswordValid = false;
          const sha256Regex = /^[0-9a-f]{64}$/i;

          // 如果数据库中已存 SHA-256 哈希，则按哈希验证
          if (sha256Regex.test(stored)) {
            isOldPasswordValid = await verifyPassword(oldPassword, stored);
          } else {
            // 兼容：数据库中存明文，直接比较明文
            if (oldPassword === stored) {
              isOldPasswordValid = true;
              // 可选：在登录迁移时已经做过迁移，这里仅标注兼容
            }
          }

          if (!isOldPasswordValid) {
            return new Response(JSON.stringify({ error: '旧密码错误' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          if (newPassword.length < 6) {
            return new Response(JSON.stringify({ error: '新密码长度至少为6位' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          if (oldPassword === newPassword) {
            return new Response(JSON.stringify({ error: '新密码不能与旧密码相同' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // 计算新密码哈希并写回（无论原来是明文还是哈希）
          const newHash = await hashPassword(newPassword);
          await env.jnr_db.prepare(
            `UPDATE admin_users SET password_hash = ? WHERE id = ?`
          ).bind(newHash, user.id).run();

          return new Response(JSON.stringify({
            success: true,
            message: '密码修改成功'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Change password error:', error);
          return new Response(JSON.stringify({ error: '密码修改失败：' + error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 验证token接口
      if (path === '/api/verify-token' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ valid: false }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const token = authHeader.substring(7);
        
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            return new Response(JSON.stringify({ valid: false }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          if (payload.exp < now) {
            return new Response(JSON.stringify({ valid: false, reason: 'expired' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify({ 
            valid: true,
            username: payload.username,
            adminId: payload.adminId
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ valid: false }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response('404啦休想盗窃后台数据 没有当前访问页面 禁止玩火哦！', { status: 404 });
    } catch (e) {
      console.error('Error:', e);
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};